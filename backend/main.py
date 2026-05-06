import os
import threading
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="La Flemme Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM = os.getenv("TWILIO_FROM_NUMBER")  # ton numéro Twilio

# Boucles actives : {task_id: threading.Event}
active_loops: dict[str, threading.Event] = {}


class FlemmeRequest(BaseModel):
    task_id: str
    user_phone: str
    interval_minutes: int = 2


def call_user(user_phone: str) -> bool:
    try:
        client = Client(TWILIO_SID, TWILIO_TOKEN)
        client.calls.create(
            to=user_phone,
            from_=TWILIO_FROM,
            # Message TwiML: dit quelque chose et raccroche
            twiml='<Response><Say language="fr-FR" voice="alice">La Flemme te rappelle. Tu as une tâche en retard. Finis la, maintenant.</Say><Pause length="2"/><Say language="fr-FR" voice="alice">Je rappelle dans deux minutes si tu ne la termines pas.</Say></Response>',
        )
        return True
    except Exception as e:
        print(f"Twilio error: {e}")
        return False


def flemme_loop(task_id: str, user_phone: str, interval_seconds: int, stop_event: threading.Event):
    print(f"[La Flemme] Start loop for task {task_id} → {user_phone}")
    while not stop_event.is_set():
        call_user(user_phone)
        stop_event.wait(interval_seconds)
    print(f"[La Flemme] Loop stopped for task {task_id}")


@app.post("/flemme/start")
def start_flemme(req: FlemmeRequest):
    if req.task_id in active_loops:
        raise HTTPException(400, "La Flemme est déjà active pour cette tâche")

    stop_event = threading.Event()
    active_loops[req.task_id] = stop_event

    t = threading.Thread(
        target=flemme_loop,
        args=(req.task_id, req.user_phone, req.interval_minutes * 60, stop_event),
        daemon=True,
    )
    t.start()

    # Premier appel immédiat (30s de délai)
    threading.Timer(30, call_user, args=[req.user_phone]).start()

    return {"status": "active", "task_id": req.task_id, "interval_minutes": req.interval_minutes}


@app.delete("/flemme/stop/{task_id}")
def stop_flemme(task_id: str):
    if task_id not in active_loops:
        return {"status": "not_found"}
    active_loops[task_id].set()
    del active_loops[task_id]
    return {"status": "stopped", "task_id": task_id}


@app.get("/flemme/active")
def list_active():
    return {"active": list(active_loops.keys())}


@app.get("/health")
def health():
    return {"status": "ok", "active_loops": len(active_loops)}

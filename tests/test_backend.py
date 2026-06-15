import os
import pytest
from fastapi.testclient import TestClient
from main import (
    app, SCHEDULE_FILE, get_system_status, get_current_schedule,
    search_web_briefing, add_calendar_event, add_received_email
)

# Set up test client
client = TestClient(app)

def test_read_root():
    """Verify that root serves the index.html template file successfully."""
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Bantz" in response.text

def test_chat_endpoint():
    """Test that chat endpoint responds correctly with a reply."""
    payload = {"message": "Hello, Bantz."}
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["reply"]) > 0

def test_system_endpoint():
    """Test that system endpoint returns core statistics values."""
    response = client.get("/api/system")
    assert response.status_code == 200
    data = response.json()
    assert "cpu_percent" in data
    assert "memory" in data
    assert "disk" in data
    assert "processes" in data
    assert isinstance(data["processes"], list)

def test_schedule_endpoints():
    """Test retrieving schedule events and adding new events dynamically."""
    # 1. Get schedule list
    get_response = client.get("/api/schedule")
    assert get_response.status_code == 200
    initial_data = get_response.json()
    assert "events" in initial_data
    assert "emails" in initial_data

    # 2. Add a new event
    event_payload = {
        "time": "08:00 PM",
        "title": "Review CS project tests",
        "category": "calendar"
    }
    post_response = client.post("/api/schedule", json=event_payload)
    assert post_response.status_code == 200
    post_data = post_response.json()
    assert post_data["status"] == "success"
    assert post_data["item"]["title"] == "Review CS project tests"

    # 3. Add a mock email
    email_payload = {
        "sender": "Professor Oak",
        "time": "09:00 PM",
        "title": "Pokedex update request",
        "category": "email"
    }
    post_email_response = client.post("/api/schedule", json=email_payload)
    assert post_email_response.status_code == 200
    post_email_data = post_email_response.json()
    assert post_email_data["status"] == "success"
    assert post_email_data["item"]["sender"] == "Professor Oak"

    # 4. Verify list updates
    get_updated = client.get("/api/schedule")
    updated_data = get_updated.json()
    assert len(updated_data["events"]) > len(initial_data["events"])
    assert len(updated_data["emails"]) > len(initial_data["emails"])

def test_agentic_tools():
    """Verify that butler agentic tool functions run correctly and return expected results."""
    # 1. System status tool
    status_report = get_system_status()
    assert "System Status Report" in status_report
    assert "CPU Load" in status_report
    
    # 2. Schedule tool
    schedule_report = get_current_schedule()
    assert "Daily Schedule" in schedule_report
    assert "Inbox" in schedule_report

    # 3. Add calendar event tool
    res_event = add_calendar_event("10:00 PM", "Late Night Coding")
    assert "Late Night Coding" in res_event
    assert "10:00 PM" in res_event
    
    # 4. Add email tool
    res_email = add_received_email("Woz", "Admissions letter details", "11:00 PM")
    assert "Woz" in res_email
    assert "Admissions letter details" in res_email


import os
import pathlib
from dotenv import load_dotenv

from uagents_core.utils.registration import (
    register_chat_agent,
    RegistrationRequestCredentials,
)

# Load environment variables from .env file
env_path = pathlib.Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

register_chat_agent(
    "estate-ai-1",
    "https://epic-tribe-router-nut.trycloudflare.com/",
    active=True,
    credentials=RegistrationRequestCredentials(
        agentverse_api_key=os.environ["ASI_API_KEY"],
        agent_seed_phrase="selector-agent",        
    ),
)
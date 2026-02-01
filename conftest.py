import pytest

@pytest.fixture(scope='session')
def setup_database():
    # Code to set up the database connection
    yield
    # Code to tear down the database connection

@pytest.fixture
def sample_data():
    return {"key": "value"}
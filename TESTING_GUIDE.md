# Testing Guide

## Backend Testing (Python)

### Setup

```bash
cd BarberBook-back
pip install pytest pytest-asyncio aiosqlite
```

### Run Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_auth.py

# Run specific test
pytest tests/test_auth.py::TestRegistration::test_register_client_success

# Run with coverage
pytest --cov=app tests/
```

### Test Structure

Tests are organized by feature:
- `tests/conftest.py` — Shared fixtures (auth, database)
- `tests/test_auth.py` — Authentication tests
- `tests/test_bookings.py` — Booking/reservation tests
- `tests/test_favorites.py` — Favorites tests

### Test Database

Tests use SQLite in-memory database (`:memory:`), so:
- No external DB needed
- Tests run fast
- Each test gets clean DB state

### Example Test

```python
def test_register_client_success(self, client):
    """Test successful client registration."""
    response = client.post(
        "/register",
        json={
            "email": "newclient@example.com",
            "username": "newclient",
            "password": "securepass123",
            "password_confirm": "securepass123",
            "role": "client",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newclient@example.com"
```

## Frontend Testing (TypeScript/React Native)

### Setup

```bash
cd BarberBookingApp
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native @types/jest
```

### Create jest.config.js

```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
};
```

### Create jest.setup.js

```javascript
import '@testing-library/jest-native/extend-expect';
```

### Run Tests

```bash
npm test
```

### Test Examples

See `__tests__/hooks/useAuth.test.example.ts` for examples.

## CI/CD Integration

Add to your CI pipeline (GitHub Actions, GitLab CI, etc.):

```yaml
# Backend tests
- name: "Run backend tests"
  run: |
    cd BarberBook-back
    pip install -r requirements.txt
    pytest --cov=app tests/

# Frontend tests  
- name: "Run frontend tests"
  run: |
    cd BarberBookingApp
    npm install
    npm test
```

## Coverage Goals

- **Auth endpoints:** 90%+ coverage
- **Booking logic:** 85%+ coverage
- **Favorite operations:** 85%+ coverage
- **Overall:** 70%+ coverage

## Testing Best Practices

1. **Test critical paths first** — Auth, booking, payments
2. **Use fixtures** — Reuse test data and setup
3. **Mock external APIs** — Don't call real APIs in tests
4. **Test error cases** — Not just happy path
5. **Keep tests isolated** — Each test should be independent
6. **Use descriptive names** — `test_register_with_duplicate_email` not `test_1`

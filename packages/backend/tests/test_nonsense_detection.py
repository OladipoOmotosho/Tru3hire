"""Tests for nonsense/gibberish content detection in job analyzer."""

from app.services.authenticity import validate_job_content


# =============================================================================
# Tests: Should REJECT (nonsense/gibberish)
# =============================================================================


def test_rejects_lorem_ipsum():
    """Lorem ipsum contains no job keywords and no English words → rejected."""
    text = (
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. "
        "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. "
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris "
        "nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in "
        "reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla "
        "pariatur. Excepteur sint occaecat cupidatat non proident, sunt in "
        "culpa qui officia deserunt mollit anim id est laborum."
    )
    is_valid, reason = validate_job_content(text)
    assert not is_valid
    assert "job posting" in reason.lower() or "job description" in reason.lower()


def test_rejects_keyboard_smash():
    """Random keyboard smashing → rejected."""
    text = "asdf jkl qwer uiop zxcv bnm tyui ghjk dfgh " * 5
    is_valid, reason = validate_job_content(text)
    assert not is_valid


def test_rejects_repeated_single_word():
    """Single word repeated many times → rejected as repetitive."""
    text = "hello " * 50
    is_valid, reason = validate_job_content(text)
    assert not is_valid
    assert "repetitive" in reason.lower()


def test_rejects_random_characters():
    """Pure random characters → rejected."""
    text = "xkcd blargh florp zibble wobbet snarg plonk fizzle " * 5
    is_valid, reason = validate_job_content(text)
    assert not is_valid


def test_rejects_numbers_only():
    """Numbers-only text → too few alpha words → rejected."""
    text = "12345 67890 11111 22222 33333 44444 55555 66666 77777 88888 99999"
    is_valid, reason = validate_job_content(text)
    assert not is_valid


def test_rejects_very_short_text():
    """Very short text → rejected."""
    text = "hello world"
    is_valid, reason = validate_job_content(text)
    assert not is_valid
    assert "too short" in reason.lower()


# =============================================================================
# Tests: Should ACCEPT (legitimate job postings)
# =============================================================================


def test_accepts_real_job_posting():
    """A realistic job description → accepted."""
    text = (
        "We are looking for a Senior Software Engineer to join our team. "
        "The ideal candidate will have 5+ years of experience in Python and "
        "React development. Responsibilities include designing and building "
        "scalable applications, collaborating with cross-functional teams, "
        "and participating in code reviews. Qualifications: BS in Computer "
        "Science, strong communication skills, and experience with cloud platforms. "
        "Benefits include health insurance, 401k, and unlimited PTO. "
        "Apply at careers@techcorp.com."
    )
    is_valid, reason = validate_job_content(text)
    assert is_valid
    assert reason == ""


def test_accepts_short_but_valid_posting():
    """Short but clearly a job posting → accepted."""
    text = (
        "Hiring Python developer for remote contract position. "
        "Must have 3 years experience with Django and REST APIs. "
        "Strong skills in database design required. Apply now. "
        "Competitive salary and flexible work schedule. "
        "Join a growing team of talented engineers."
    )
    is_valid, reason = validate_job_content(text)
    assert is_valid


def test_accepts_minimal_job_posting():
    """Minimal but legitimate posting with enough job keywords → accepted."""
    text = (
        "Data Analyst position available at our company. "
        "The role requires experience with SQL, Excel, and data visualization. "
        "Candidates should have strong communication and project management skills. "
        "Full-time employment with competitive benefits package."
    )
    is_valid, reason = validate_job_content(text)
    assert is_valid

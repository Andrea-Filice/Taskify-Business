.PHONY: test coverage clean

test:
	@echo "Running tests..."
	pytest

coverage:
	@echo "Running coverage..."
	pytest --cov=. --cov-report=term-missing

clean:
	@echo "Cleaning up..."
	rm -rf __pycache__ .pytest_cache .coverage htmlcov
.PHONY: bootstrap dev down logs test lint migrate superuser schema build backup validate-production deploy
bootstrap dev down logs test lint migrate superuser schema build backup validate-production:
	python scripts/tasks.py $@

deploy:
	python scripts/tasks.py deploy --release-sha "$(RELEASE_SHA)"

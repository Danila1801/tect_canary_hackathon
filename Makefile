PORT ?= 3000

.PHONY: dev scan eval test check build

dev:
	npm run dev -- --port $(PORT)

scan:
	npm run scan

eval:
	npm run eval

test:
	npm test

check:
	npm run check

build:
	npm run build

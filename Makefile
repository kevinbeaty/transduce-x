PROJECT:=transduce-x
BUILD:=build/$(PROJECT)
NPM_BIN:=$(shell npm bin)

.PHONY: all clean js test watch
all: test js

clean:
	rm -rf build

watch:
	$(NPM_BIN)/gulp watch

test: lib | node_modules
	$(NPM_BIN)/jshint test/*.js
	node --harmony $(NPM_BIN)/tape test/*.js

lib: src/*.js | node_modules
	$(NPM_BIN)/gulp

test-bail:
	$(MAKE) test | $(NPM_BIN)/tap-bail

node_modules:
	npm install

%.min.js: %.js | node_modules
	$(NPM_BIN)/uglifyjs $< -o $@ -c -m

%.gz: %
	gzip -c9 $^ > $@

js: $(BUILD).js $(BUILD).min.js

$(BUILD).js: index.js src/*.js lib | build
	$(NPM_BIN)/browserify -p bundle-collapser/plugin -s transduce-x index.js > $@

build:
	mkdir -p build

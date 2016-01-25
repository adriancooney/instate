import State from "../src/State";
import assert from "assert";

describe("Store", () => {
    describe("constructor", () => {
        it("should create a new state with an empty initial state", () => {
            let state = new State();
            assert(Object.keys(state.getState()).length === 0);
        });

        it("should create a new state with an initial state", () => {
            let initialState = {
                foo: "bar",
                bar: "baz"
            };

            let state = new State(initialState);

            // Ensure we have our own copy
            assert(initialState !== state.getState());
            assert.deepEqual(initialState, state.getState());
        });
    });

    describe("getState", () => {
        it("should return the state", () => {
            let state = new State();
            assert(state.getState() === state.state);
        });
    });

    describe("update", () => {
        it("should update the state of the object", () => {
            let state = new State();

            state.update("foo", {});
            state.update("foo.bar", "baz");

            assert.deepEqual(state.getState(), {
                foo: {
                    bar: "baz"
                }
            });
        });

        it("should update the state of an object by creating a path", () => {
            let state = new State();

            state.update("foo.bar.baz", true, true);

            assert.deepEqual(state.getState(), {
                foo: {
                    bar: {
                        baz: true
                    }
                }
            });
        });

        it("should not update the state given an invalid path", () => {
            let state = new State();

            assert.throws(state.update.bind(state, "foo.bar", "baz"), /attempting to update/i);
        });

        it("should not attempt to set on a value other than an object", () => {
            let state = new State({
                foo: 1
            });

            assert.throws(state.update.bind(state, "foo.bar", "baz"), /attempting to update/i);
        });

        it("should not attempt to create when an existing value is already in place", () => {
            // Why do we do this?
            // Because where does the value we would overwrite go? Just dump it? Definitely error
            // prone if we allow them to overwrite.
            let state = new State({
                foo: 1
            });

            assert.throws(state.update.bind(state, "foo.bar", "baz", true), /attempting to overwrite/i);
        });
    });

    describe("get", () => {
        it("should get the value of a path in the state", () => {
            let state = new State();

            state.update("foo.bar.baz", "boot", true);
            assert.equal(state.get("foo.bar.baz"), "boot");
            assert.deepEqual(state.get("foo.bar"), { baz: "boot" });
        });

        it("throws an error for an invalid path", () => {
            let state = new State();
            assert.throws(state.get.bind(state, "foo.bar"), /invalid/i);
        });
    });

    describe("delete", () => {
        it("should delete a value from the state entirely", () => {
            let state = new State();

            state.update("foo.bar.baz", "boot", true);
            state.delete("foo.bar.baz");
            assert(Object.keys(state.get("foo.bar")).indexOf("baz") === -1);
        });
    });

    describe("expandTree", () => {
        it("should correctly expand the tree", () => {
            assert.deepEqual(State.expandTree("foo.bar.baz"), ["foo", "foo.bar", "foo.bar.baz"]);
        });
    });

    describe("subscribe", () => {
        it("should subscribe to updates for all paths", (next) => {
            let state = new State();

            let muts = [
                { path: "foo", value: {}, state: { foo: {} } },
                { path: "foo.bar", value: true, state: { foo: { bar: true } } },
                { path: "foo.bar", value: false, previous: true, state: { foo: { bar: false } } },
                { path: "baz", value: "bar", state: { foo: { bar: false }, baz: "bar" } },
            ];

            state.subscribe((aPath, aValue, aOldValue, aState) => {
                let update = muts.shift();
                let { path, value, state, previous } = update;

                assert.equal(path, aPath);
                assert.equal(value, aValue);
                assert.deepEqual(state, aState);

                if(previous) {
                    assert.deepEqual(aOldValue, previous);
                }

                if(!muts.length) next();
            });

            muts.slice().forEach(mut => {
                let { path, value } = mut
                state.update(path, value);
            });
        });

        it("should subscribe to updates for a specific path", (next) => {
            let state = new State();

            state.subscribe("foo.bar", (path, value) => {
                assert.equal("foo.bar", path);
                assert.equal("baz", value);
                next();
            });

            state.update("foo.bar", "baz", true);
        });

        it("should subscribe to updates further down the tree", (next) => {
            let state = new State();

            state.subscribe("foo", (path, value) => {
                assert.equal("foo.bar.baz", path);
                assert.equal(value, true);
                next();
            });

            state.update("foo.bar.baz", true, true);
        });

        it("should handle multiple subscribers", (next) => {
            let state = new State();

            let count = 2;

            for(let i = 0; i <= count; i++) {
                state.subscribe("foo.bar", () => {
                    if(!count) next();
                    else count--;
                });
            }

            state.update("foo", {});
            state.update("foo.bar", "wut");
        });

        it("should delete and correctly tell subscribers", (next) => {
            let state = new State();
            state.update("foo.bar.baz", "boot", true);
            state.subscribe("foo.bar.baz", (path, value, oldValue, state) => {
                assert.equal(value, undefined);
                next();
            });

            state.delete("foo.bar.baz");
        });
    });

    describe("unsubscribe", () => {
        it("should unsubscribe all event listeners for an event", () => {
            let state = new State();

            state.subscribe("foo.bar", () => {})
            state.subscribe("foo.bar", () => {})
            state.subscribe("foo.bar", () => {})

            assert.equal(state.subscriptions["foo.bar"].length, 3);
            state.unsubscribe("foo.bar");
            assert(typeof state.subscriptions["foo.bar"] === "undefined");
        });

        it("should unsubscribe a specific listener for an event", () => {
            let state = new State();

            let listener = () => {}
            state.subscribe("foo.bar", () => {})
            state.subscribe("foo.bar", listener)
            state.subscribe("foo.bar", () => {})
            state.unsubscribe("foo.bar", listener);
            assert(state.subscriptions["foo.bar"].indexOf(listener) === -1);
        });
    });

    /* Propose API.
    describe("scope", () => {
        let state = new State({
            foo: {
                bar: "baz"
            }
        });

        it("should return a new scoped state", () => {
            let foo = state.scope("foo");

            assert(foo instanceof State);
        });

        it("should use the state of path on the parent state as it's initial state", () => {
            let foo = state.scope("foo");

            assert.deepEqual(foo.getState(), {
                bar: "baz"
            });
        })

        it("should propagate updates back to the main state", () => {
            let foo = state.scope("foo");

            state.subscribe((path, value) => {
                assert.equal("foo.bar", path);
                assert.equal(value, "baz");
            });

            foo.update("bar", "baz");
        });
    }); */
});
import debug from "debug";

/**
 * The key path separator.
 * @type {String}
 */
const SEPARATOR = ".";

// Some debug functions.
const debugState = debug("state");
const debugComponent = debug("state:component");

export default class State {
    /**
     * Create a new State object.
     *
     * @param  {Object} initialState The initial state.
     * @return {State}
     */
    constructor(initialState = {}) {
        this.state = { ...initialState };
        this.subscriptions = {}
    }

    /**
     * Return the root current state object.
     * 
     * @return {Object} The current state.
     */
    getState() {
        return this.state;
    }

    /**
     * Set the root current state. Useful for setting
     * the initial state on the global state.
     * 
     * @param {Object} state The root state.
     */
    setState(state) {
        debugState("Setting root state.", state);
        this.state = state;
    }

    /**
     * Return the value at the key path.
     * 
     * @throws {Error} if invalid key path is passed.
     * @param  {String} path The key path seperated by "." (SEPERATOR).
     * @return {Any}         The value at that keypath.
     */
    get(path) {
        if(path === SEPARATOR) return this.getState();

        return path.split(SEPARATOR).reduce((parent, prop, i, split) => {
            if(typeof parent[prop] === "object" || i === split.length - 1) return parent[prop];
            else throw new Error(`Unable to get with invalid path '${path}'.`);
        }, this.getState());
    }

    /**
     * Deletes a value from the state at a given key path.
     *
     * NOTE: Any subscriptions for this particular value
     * will be notified that the value has changed to
     * `undefined` however the key will be fully removed
     * from the parent object.
     *
     * @throws {Error} if invalid key path is passed.
     * @param  {String} path The key path towards the value.
     */
    delete(path) {
        if(path === SEPARATOR) return this.setState({});

        const tree = [SEPARATOR, ...State.expandTree(path)];
        const value = this.get(path);
        const valueKey = path.split(SEPARATOR).pop();
        const parentPath = tree[tree.length - 2];
        const parentValue = this.get(parentPath);

        debugState(`Deleting '${path}' from global state.`);
        this.update(parentPath, Object.keys(parentValue).reduce((value, key) => {
            if(key !== valueKey) value[key] = parentValue[key];
            return value;
        }, {}));

        this.handleChange(path, undefined, value);
    }

    /**
     * Update the value at a given key path. This notifies
     * any subscribers to the key path and any parent 
     * subscribers up the chain from the key path.
     *
     * @throws {Error} if invalid key path is passed and `create` flag is false.
     * @param  {String}  path   The key path.
     * @param  {Any}     value  The value to set at the given key path.
     * @param  {Boolean} create Create the path to the key path if it does not exist.
     */
    update(path, value, create = false) { 
        if(path === SEPARATOR) {
            const oldState = this.getState();
            this.setState(value);
            this.handleChange(path, value, oldState);
            return
        }
        
        path.split(SEPARATOR).reduce((parent, prop, i, split) => {
            if(i === split.length - 1) {
                const oldValue = parent[prop];
                parent[prop] = value;
                this.handleChange(path, value, oldValue);
            } else {
                const propValue = parent[prop];
                if(typeof propValue === "undefined" || typeof propValue !== "object") {
                    if(!create)
                        throw new Error(`Attempting to update an invalid path '${path}' on state tree.`);

                    if(typeof propValue !== "undefined")
                        throw new Error(`Attempting to overwrite value on path '${path}' on state tree.`);

                    parent[prop] = {};
                }

                return parent[prop];
            }
        }, this.getState());
    }

    /**
     * Subscibe to updates at a given key path.
     *
     * NOTE: You will be notified of any changes
     * down the tree to your value, if any.
     * 
     * @param  {String}   path     The key path to subscribe to (optional, all changes if omitted).
     * @param  {Function} listener The listener function. It recieves (path, value, oldValue, state).
     */
    subscribe(path, listener) {
        if(typeof path === "function") listener = path, path = SEPARATOR;
        if(typeof listener !== "function") throw new Error(`Subscription handler must be a function.`);
        this.subscriptions[path] = [...(this.subscriptions[path] || []), listener];
    }

    /**
     * Unsubscribe from updates to a given key path.
     *
     * @param  {String}   path     The key path.
     * @param  {Function} listener The listener function to unsubscibe (optional, all removed if omitted).
     */
    unsubscribe(path, listener) {
        if(!path) path = SEPARATOR;
        if(this.subscriptions[path]) {
            if(listener) {
                debugState(`Removing subscription on '${path}'.`);
                this.subscriptions[path].splice(this.subscriptions[path].indexOf(listener), 1);
            } else {
                debugState(`Removing all subscription on '${path}'.`);
                delete this.subscriptions[path];
            }
        }
    }

    /**
     * Handle changes made to the state tree. This notifies any listening
     * subscribers to changes of their values.
     * 
     * @private
     * @param  {String} path     The key path.
     * @param  {Any}    value    The updated value.
     * @param  {Any}    oldValue The previous value.
     */
    handleChange(path, value, oldValue) {
        debugState(`State change for key '${path}'.`, value);

        [SEPARATOR, ...State.expandTree(path)].forEach(key => {
            debugState(`Notifying subscriptions for path '${key}'.`);
            let subs = this.subscriptions[key];

            if(subs) {
                subs.forEach(sub => sub.call(null, path, value, oldValue, this.getState()));
            }
        });
    }

    /**
     * Expand the key path's tree into segments. 
     *
     * Example:
     *
     *  State.expandTree("foo.bar.baz") // ["foo", "foo.bar", "foo.bar.baz"]
     *  
     * @param  {String} path The key path.
     * @return {Array}       The path segments.
     */
    static expandTree(path) {
        return path.split(SEPARATOR).reduce((paths, segment, i, split) => {
            paths.push(split.slice(0, i + 1).join(SEPARATOR));
            return paths;
        }, []);
    }
}

/**
 * Export a global state that will be the same across all imports.
 * @type {State}
 */
export const state = new State();

/**
 * Connect a React component's local state to a State object.
 * 
 * @param  {Object} descriptor  The key map of { localKey: stateKey }.
 * @param  {Object} targetState The target state to proxy the changes onto (default global state).
 * @return {Function}           The modified class.
 */
export function connect(descriptor, targetState = state) {
    const keys = Object.keys(descriptor);
    const subs = {};

    return function(target) {
        return class Provider extends target {
            /*
             * It's a pity getDefaultState is no more with ES6 classes because 
             * it really would have come in handy here. We need to ensure we have
             * a default state because it's expected when you connect properties to the global
             * state, even if they are undefined.
             */
            constructor(...args) {
                super(...args);
                if(!this.state) this.state = {};
            }

            /*
             * Listen to any changes on the global state and update the local component state.
             */
            componentWillMount() {
                debugComponent(`${super.constructor.name}:componentWillMount(): Subscribing to keys '${keys.join("', '")}' on global state.`);

                let initialState = {};
                keys.forEach(key => {
                    // Can't forget to set the values on the initial state
                    initialState[key] = targetState.get(descriptor[key]);

                    // Subscribe to changes on our target state object
                    targetState.subscribe(descriptor[key], subs[key] = (path, value, state) => {
                        debugComponent(`${super.constructor.name}: State update on path '${descriptor[key]}'. Updating key '${key}' on local state.`, value);

                        let newState = {};
                        newState[key] = value;
                        this.setState(newState, null, false);
                    });
                });

                this.setState(initialState, null, false);

                // We call this last so any procedures in componentWillMount can
                // use the connected state.
                if(super.componentWillMount) super.componentWillMount();
            }

            /*
             * Clean up any of the listeners.
             */
            componentWillUnmount() {
                if(super.componentWillUnmount) super.componentWillUnmount();

                debugComponent(`${super.constructor.name}:componentWillUnmount(): Unsubscribing from keys '${keys.join("', '")}' on global state.`);
                keys.forEach(key => targetState.unsubscribe(descriptor[key], subs[key]));
            }

            /*
             * Add a custom parameter to the setState method to allow us
             * to flag whether or not to proxy the updates to the global 
             * state. This is required for when we update the local state
             * when subscriptions have changed otherwise we'd end up in an
             * infinite loop.
             */
            setState(state, callback, map = true) {
                if(map) {
                    keys.forEach(key => {
                        if(typeof state[key] !== "undefined") {
                            debugComponent(`${super.constructor.name}:setState(): Updating global state key '${key}' with value:`, state[key]);
                            targetState.update(descriptor[key], state[key]);
                        }
                    });
                }

                return super.setState(state, callback);
            }
        }
    }
}
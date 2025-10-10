import { ref } from 'vue';

// Using a simple ref that we will replace entirely to guarantee reactivity.
export const events = ref({});

export function emit(event, ...args) {
  // By creating a new object each time, we ensure Vue's watcher always detects the change.
  events.value = { 
    ...events.value, 
    [event]: { data: args, id: Date.now() } // Add a unique ID to be certain
  };
}
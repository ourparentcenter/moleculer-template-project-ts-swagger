<template>
  <div>
    <p>{{{{raw-helper}}}}{{ title }}{{{{/raw-helper}}}}</p>
    <ul>
      <li v-for="todo in todos" :key="todo.id" @click="increment">
        {{{{raw-helper}}}}{{ todo.id }}{{{{/raw-helper}}}} - {{{{raw-helper}}}}{{ todo.content }}{{{{/raw-helper}}}}
      </li>
    </ul>
    <p>Count: {{{{raw-helper}}}}{{ todoCount }}{{{{/raw-helper}}}} / {{{{raw-helper}}}}{{ meta.totalCount }}{{{{/raw-helper}}}}</p>
    <p>Active: {{{{raw-helper}}}}{{ active ? 'yes' : 'no' }}{{{{/raw-helper}}}}</p>
    <p>Clicks on todos: {{{{raw-helper}}}}{{ clickCount }}{{{{/raw-helper}}}}</p>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  computed,
  ref,
  toRef,
  Ref,
} from 'vue';
import { Todo, Meta } from './models';

function useClickCount() {
  const clickCount = ref(0);
  function increment() {
    clickCount.value += 1
    return clickCount.value;
  }

  return { clickCount, increment };
}

function useDisplayTodo(todos: Ref<Todo[]>) {
  const todoCount = computed(() => todos.value.length);
  return { todoCount };
}

export default defineComponent({
  name: 'CompositionComponent',
  props: {
    title: {
      type: String,
      required: true
    },
    todos: {
      type: Array as PropType<Todo[]>,
      default: () => []
    },
    meta: {
      type: Object as PropType<Meta>,
      required: true
    },
    active: {
      type: Boolean
    }
  },
  setup(props) {
    return { ...useClickCount(), ...useDisplayTodo(toRef(props, 'todos')) };
  },
});
</script>

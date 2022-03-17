import { createClient } from "@liveblocks/client";
import { enhancer } from "@liveblocks/redux";
import { configureStore, createSlice } from "@reduxjs/toolkit";

// Replace this key with your public key provided at https://liveblocks.io/dashboard/apikeys
const PUBLIC_KEY = "pk_xxxxxxx";

if (PUBLIC_KEY.startsWith("pk_xxxxxxx")) {
  throw new Error(
    "Replace the above constant PUBLIC_KEY with your own Liveblocks public key."
  );
}

const client = createClient({
  publicApiKey: PUBLIC_KEY,
});

const COLORS = ["#DC2626", "#D97706", "#059669", "#7C3AED", "#DB2777"];

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function getRandomColor() {
  return COLORS[getRandomInt(COLORS.length)];
}

const initialState = {
  shapes: {},
  selectedShape: null,
  isDragging: false,
};

const slice = createSlice({
  name: "state",
  initialState,
  reducers: {
    addRectangle: (state) => {
      const shapeId = Date.now();
      const shape = {
        x: getRandomInt(300),
        y: getRandomInt(300),
        fill: getRandomColor(),
      };
      state.shapes[shapeId] = shape;
    },
    deleteRectangle: (state) => {
      if (state.selectedShape) {
        delete state.shapes[state.selectedShape];
      }
    },
    selectShape: (state, action) => {
      state.selectedShape = action.payload;
      state.isDragging = true;
    },
    deselectShape: (state) => {
      state.isDragging = false;
    },
    moveShape: (state, action) => {
      if (state.isDragging && state.selectedShape) {
        state.shapes[state.selectedShape].x = action.payload.x - 50;
        state.shapes[state.selectedShape].y = action.payload.y - 50;
      }
    },
    undo: (state) => {},
    redo: (state) => {},
  },
});

export const {
  addRectangle,
  deleteRectangle,
  selectShape,
  deselectShape,
  moveShape,
  undo,
  redo,
} = slice.actions;

export function makeStore() {
  return configureStore({
    reducer: slice.reducer,
    enhancers: [
      enhancer({
        client,
        presenceMapping: { selectedShape: true },
        storageMapping: { shapes: true },
      }),
    ],
  });
}

const store = makeStore();

export default store;

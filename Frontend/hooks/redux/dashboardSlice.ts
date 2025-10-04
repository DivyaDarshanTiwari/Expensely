// dashboardSlice.js
import { createSlice } from "@reduxjs/toolkit";

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    refreshCount: 0, // instead of boolean
  },
  reducers: {
    triggerRefresh: (state) => {
      state.refreshCount += 1;
    },
  },
});

export const { triggerRefresh } = dashboardSlice.actions;
export default dashboardSlice.reducer;

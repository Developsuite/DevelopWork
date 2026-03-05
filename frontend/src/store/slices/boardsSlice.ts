import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Board } from '../../types';

interface BoardsState {
  byId: Record<string, Board>;
  allIds: string[];
  loading: boolean;
  error: string | null;
}

const initialState: BoardsState = {
  byId: {},
  allIds: [],
  loading: false,
  error: null,
};

const boardsSlice = createSlice({
  name: 'boards',
  initialState,
  reducers: {
    setBoardData: (state, action: PayloadAction<{ boards: Board[] }>) => {
      const { boards } = action.payload;
      state.byId = {};
      state.allIds = [];
      
      boards.forEach((board) => {
        state.byId[board.id] = board;
        state.allIds.push(board.id);
      });
    },
    addBoard: (state, action: PayloadAction<Board>) => {
      const board = action.payload;
      state.byId[board.id] = board;
      state.allIds.push(board.id);
    },
    updateBoard: (state, action: PayloadAction<Partial<Board> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      if (state.byId[id]) {
        state.byId[id] = { ...state.byId[id], ...updates };
      }
    },
    removeBoard: (state, action: PayloadAction<string>) => {
      const boardId = action.payload;
      delete state.byId[boardId];
      state.allIds = state.allIds.filter((id) => id !== boardId);
    },
    setBoardLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setBoardError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setBoardData,
  addBoard,
  updateBoard,
  removeBoard,
  setBoardLoading,
  setBoardError,
} = boardsSlice.actions;

export default boardsSlice.reducer;

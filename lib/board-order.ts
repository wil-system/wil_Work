type BoardLike = {
  id: string;
};

export function orderBoardsForMenu<T extends BoardLike>(boards: readonly T[]): T[] {
  const feedBoards = boards.filter(board => board.id === 'feed');
  const noticeBoards = boards.filter(board => board.id === 'notice');
  const otherBoards = boards.filter(board => board.id !== 'feed' && board.id !== 'notice');

  return [...feedBoards, ...noticeBoards, ...otherBoards];
}

export function orderBoardsForSidebar<T extends BoardLike>(boards: readonly T[]): T[] {
  return orderBoardsForMenu(boards).filter(board => board.id !== 'feed');
}

module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('join_room', (roomId) => {
      socket.join(`room_${roomId}`);
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(`room_${roomId}`);
    });

    socket.on('join_admin_feed', () => {
      socket.join('admin_monitor');
    });

    socket.on('leave_admin_feed', () => {
      socket.leave('admin_monitor');
    });

    socket.on('disconnect', () => {
      // Disconnection handled gracefully
    });
  });
};

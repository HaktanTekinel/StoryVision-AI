const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || res.statusCode || 500;
  const isOperational = Boolean(error.isOperational);
  const message = isOperational
    ? error.message
    : "Beklenmeyen bir sunucu hatasi olustu.";

  console.error(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${statusCode}`,
    error.stack || error.message
  );

  return res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;

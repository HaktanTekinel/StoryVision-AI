const errorHandler = (error, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  return res.status(statusCode).json({
    success: false,
    message: error.message || "Beklenmeyen bir sunucu hatasi olustu.",
  });
};

module.exports = errorHandler;

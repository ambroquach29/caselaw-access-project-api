export const authorization = ({ req }: any) => {
  const token = req.headers.authorization;
  if (process.env['MODE'] === 'PRODUCTION') {
    if (!token) {
      throw new Error('Please add authentication token in header.');
    } else if (token !== process.env['ACCESS_TOKEN']) {
      throw new Error('Authentication token invalid.');
    }
  } else {
    if (token !== process.env['ACCESS_TOKEN']) {
      throw new Error('You are not authorized.');
    }
  }
  return token;
};

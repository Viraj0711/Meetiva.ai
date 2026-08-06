import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 bg-gradient-primary bg-clip-text text-9xl font-bold text-transparent">
          404
        </h1>
        <h2 className="mb-2 text-3xl font-semibold">Page Not Found</h2>
        <p className="mb-8 text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="rounded-lg bg-gradient-primary px-6 py-2 font-medium text-white hover:opacity-90"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

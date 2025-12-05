export const LoadingSpinner = ({ message = 'Loading...' }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
};

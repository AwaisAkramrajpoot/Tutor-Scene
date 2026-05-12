import { Link } from 'react-router-dom';
import Layout from './Layout';
import BookSessionLearnerFlow from './bookSession/BookSessionLearnerFlow';

const BookSessionPage = () => {
  return (
    <Layout>
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-600">
            <Link
              to="/dashboard"
              className="text-brand-medium-blue hover:underline"
            >
              Dashboard
            </Link>
            <span className="mx-2">/</span>
            <span>Book a Session</span>
          </p>
        </div>
      </div>
      <BookSessionLearnerFlow embedded={false} />
    </Layout>
  );
};

export default BookSessionPage;

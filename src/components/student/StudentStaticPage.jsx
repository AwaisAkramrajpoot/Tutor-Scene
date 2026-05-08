import Layout from '../Layout';

const StudentStaticPage = ({ title, children }) => (
  <Layout>
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
      <div className="text-gray-600 text-sm leading-relaxed space-y-3">{children}</div>
    </div>
  </Layout>
);

export default StudentStaticPage;

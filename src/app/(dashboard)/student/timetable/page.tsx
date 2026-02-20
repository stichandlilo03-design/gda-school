import DashboardHeader from "@/components/layout/dashboard-header";

export default function Page() {
  return (
    <>
      <DashboardHeader title="Timetable" subtitle="Your weekly class schedule" />
      <div className="p-6 lg:p-8">
        <div className="card">
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Timetable</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">Your personalized timetable will appear here based on your enrolled classes and preferred session.</p>
          </div>
        </div>
      </div>
    </>
  );
}

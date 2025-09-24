export default function Card({ title, description, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white rounded-2xl p-6 shadow-lg border border-green-100 hover:shadow-xl hover:scale-[1.02] transition transform"
    >
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <p className="mt-2 text-gray-600">{description}</p>
      <div className="mt-3 text-sm">
        <span className="text-green-600 hover:text-green-500 font-medium">
          Buka →
        </span>
      </div>
    </div>
  );
}

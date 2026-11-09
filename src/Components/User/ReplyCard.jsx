export default function ReplyCard({ replies = [] }) {
  return (
    <div className="ml-12 mt-3 space-y-3">
      {replies.map((reply) => (
        <ReplyItem key={reply._id} reply={reply} />
      ))}
    </div>
  );
}

function ReplyItem({ reply }) {
  const isDev = reply.userId?.role === "developer";

  return (
    <div className="bg-[#f5efe6] border border-[#e0d9d0] rounded-xl px-4 py-3">
      <div className="flex flex-col gap-2 mb-1.5">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="rounded-full size-6 flex items-center justify-center shrink-0 bg-[#c4956a]">
            <span className="font-semibold text-white text-[12px]">
              {(reply.userId?.name ?? "Deleted User").charAt(0).toUpperCase()}
            </span>
          </div>

          <p className="font-semibold text-[#111] text-[13px]">
            {reply.userId?.name ?? "Deleted User"}
          </p>

          {/* DEV badge */}
          {isDev && (
            <span className="bg-[#c4956a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded leading-none tracking-wide">
              DEV
            </span>
          )}

          {reply.createdAt && (
            <p className="font-light text-[#767676] text-[11px]">
              {new Date(reply.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        {/* Body */}
        <p className="font-light text-[#333] text-[13px]">{reply.comment}</p>
      </div>
    </div>
  );
}

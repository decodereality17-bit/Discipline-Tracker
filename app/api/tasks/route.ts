export async function POST(req: Request) {
  const body = await req.json();

  return Response.json({
    success: true,
    message: "Task API working",
    data: body,
  });
}

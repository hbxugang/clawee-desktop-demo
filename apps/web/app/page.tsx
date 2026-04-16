import { getDemoSnapshot } from "../lib/api";

export default async function HomePage() {
  const snapshot = await getDemoSnapshot();

  return (
    <main>
      <h1>Clawee Desktop Demo</h1>
      <p>当前时间：{snapshot.time}</p>
      <p>随机数：{snapshot.random}</p>
    </main>
  );
}

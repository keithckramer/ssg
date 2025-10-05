export function Header() {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Sports Sticks – Mini MVP</h1>
        <p className="muted">Each group holds numbers 0–9. (home+away) % 10 decides the winner.</p>
      </div>
    </div>
  );
}

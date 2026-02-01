function HomePage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Welcome to the Home page</h1>

      {/* Add scrollable content to test sticky navbar */}
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">About Our Platform</h2>
          <p className="text-lg mb-4">
            This is a resource management system designed to help you manage
            your resources efficiently. Scroll down to see the navbar stick to
            the top of the page.
          </p>
        </section>

        {/* Generate multiple sections for scrollable content */}
        {Array.from({ length: 20 }).map((_, i) => (
          <section key={i} className="border-t pt-6">
            <h3 className="text-xl font-medium mb-3">Section {i + 1}</h3>
            <p className="mb-2">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </p>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse
              cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
              cupidatat non proident, sunt in culpa qui officia deserunt mollit
              anim id est laborum.
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}

export default HomePage;

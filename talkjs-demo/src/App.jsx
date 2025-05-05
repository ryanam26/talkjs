import TalkJSChat from './components/TalkJSChat';

function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ textAlign: 'center', margin: 0, paddingBottom: '32px' }}>
          TalkJS OpenAI Chat Demo
        </h1>
        <TalkJSChat />
      </div>
    </div>
  );
}

export default App;

import { Hero, Features, DiseaseManager, Footer } from './components'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Hero />
      <Features />
      <DiseaseManager />
      <Footer />
    </div>
  )
}

export default App

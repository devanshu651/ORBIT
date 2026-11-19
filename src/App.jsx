import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, OrbitControls, Sparkles, Stars } from '@react-three/drei'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowLeft, ArrowRight, Crosshair, RotateCcw } from 'lucide-react'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

const planets = [
  { name:'NOVERA', classification:'Oceanic superworld', distance:'0.42 fictional AU', temperature:'18 C', period:'184 local days', description:'A blue world wrapped in silver seas, where floating research cities drift above continent-sized storms.', radius:.72, orbit:3.2, speed:.17, start:.2, color:'#55d8ff', accent:'#1c77a8' },
  { name:'THALOS', classification:'Amber desert planet', distance:'0.81 fictional AU', temperature:'46 C', period:'312 local days', description:'A vast golden desert crossed by glass canyons and luminous dust storms that sing at dusk.', radius:.92, orbit:4.5, speed:.115, start:2.1, color:'#ffad55', accent:'#9c4d24' },
  { name:'VEYRA', classification:'Violet gas giant', distance:'1.36 fictional AU', temperature:'-61 C', period:'721 local days', description:'An immense violet giant with restless bands of plasma and a family of small, icy moons.', radius:1.18, orbit:6.1, speed:.075, start:4.1, color:'#a98cff', accent:'#5140a1', ring:true },
  { name:'CAELUM', classification:'Crimson ice world', distance:'2.08 fictional AU', temperature:'-112 C', period:'1,108 local days', description:'A remote crimson world of frozen methane plains beneath a thin, aurora-lit atmosphere.', radius:.58, orbit:7.7, speed:.052, start:5.45, color:'#ff6a75', accent:'#912f43' },
]

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')))
  } catch { return false }
}

function OrbitalPath({ radius }) {
  const points = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2)
    return curve.getPoints(128).map(p => new THREE.Vector3(p.x, 0, p.y))
  }, [radius])
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <line geometry={geometry}><lineBasicMaterial color="#6d86a5" transparent opacity={.16} /></line>
}

function Planet({ planet, index, selected, onSelect }) {
  const group = useRef()
  const mesh = useRef()
  const [hovered, setHovered] = useState(false)
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  useFrame((state, delta) => {
    if (!group.current) return
    const angle = planet.start + state.clock.elapsedTime * planet.speed * (reduceMotion ? .08 : 1)
    group.current.position.set(Math.cos(angle) * planet.orbit, Math.sin(angle * .55) * .18, Math.sin(angle) * planet.orbit)
    if (mesh.current) mesh.current.rotation.y += delta * (.12 + index * .025)
  })
  const handleClick = event => {
    event.stopPropagation()
    const position = new THREE.Vector3()
    group.current.getWorldPosition(position)
    onSelect(planet, position)
  }
  return (
    <group ref={group}>
      <Float speed={reduceMotion ? 0 : 1.2} rotationIntensity={reduceMotion ? 0 : .12} floatIntensity={reduceMotion ? 0 : .18}>
        <mesh ref={mesh} scale={hovered || selected ? 1.12 : 1}
          onPointerEnter={event => { event.stopPropagation(); setHovered(true); document.body.style.cursor='pointer' }}
          onPointerLeave={() => { setHovered(false); document.body.style.cursor='auto' }}
          onClick={handleClick}>
          <sphereGeometry args={[planet.radius, 48, 48]} />
          <meshStandardMaterial color={planet.color} roughness={.72} metalness={.12} emissive={planet.accent} emissiveIntensity={hovered ? .28 : .12} />
        </mesh>
        {index === 1 && <mesh rotation={[Math.PI/2.6,.2,.1]}><torusGeometry args={[planet.radius*1.13,planet.radius*.018,12,96]} /><meshStandardMaterial color="#ffd69a" emissive="#8f5426" emissiveIntensity={.2} /></mesh>}
        {planet.ring && <mesh rotation={[Math.PI/2.35,.18,0]}><torusGeometry args={[planet.radius*1.48,planet.radius*.16,28,128]} /><meshStandardMaterial color="#8174c7" roughness={.55} metalness={.2} transparent opacity={.82} /></mesh>}
      </Float>
      {hovered && <pointLight position={[0,0,0]} color={planet.color} intensity={1.2} distance={4} />}
    </group>
  )
}

function AsteroidField() {
  const count = typeof window !== 'undefined' && window.innerWidth < 768 ? 18 : 42
  const asteroids = useMemo(() => Array.from({length:count}, (_, i) => ({
    key:i, position:[(Math.random()-.5)*24,(Math.random()-.5)*12,-3-Math.random()*20],
    scale:.03+Math.random()*.12, rotation:[Math.random()*Math.PI,Math.random()*Math.PI,0],
  })), [count])
  return <group>{asteroids.map(a => <mesh key={a.key} position={a.position} scale={a.scale} rotation={a.rotation}><dodecahedronGeometry args={[1,0]} /><meshStandardMaterial color="#647080" roughness={.95} metalness={.1} /></mesh>)}</group>
}

function SolarScene({ selected, onSelect, section }) {
  const group = useRef()
  useFrame((state) => { if (group.current) group.current.rotation.y = state.clock.elapsedTime * .018 })
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return (
    <group ref={group}>
      <ambientLight intensity={.22} />
      <directionalLight position={[4,5,6]} intensity={2.2} color="#d8e9ff" />
      <pointLight position={[0,0,0]} intensity={4.5} distance={18} color="#ffd3a1" />
      <mesh><sphereGeometry args={[1.12,64,64]} /><meshBasicMaterial color="#ffcf8a" /></mesh>
      <mesh scale={1.16}><sphereGeometry args={[1.12,32,32]} /><meshBasicMaterial color="#ff9d44" transparent opacity={.12} side={THREE.BackSide} /></mesh>
      <mesh scale={1.38}><sphereGeometry args={[1.12,32,32]} /><meshBasicMaterial color="#ffb85c" transparent opacity={.045} side={THREE.BackSide} /></mesh>
      {planets.map(p => <OrbitalPath key={p.name} radius={p.orbit} />)}
      {planets.map((p,i) => <Planet key={p.name} planet={p} index={i} selected={selected?.name===p.name} onSelect={onSelect} />)}
      {section >= 1 && <group position={[0,0,-12]}><Sparkles count={reduced?40:180} scale={[26,12,16]} size={1.2} speed={reduced?0:.12} color="#738cff" /><Sparkles count={reduced?20:80} scale={[18,8,12]} size={2} speed={reduced?0:.08} color="#a94db4" /></group>}
      {section >= 1 && <AsteroidField />}
      {!reduced && <Sparkles count={typeof window !== 'undefined' && window.innerWidth < 768 ? 50 : 150} scale={[18,10,18]} size={1.1} speed={.08} color="#a9bdd2" />}
      <Stars radius={55} depth={35} count={typeof window !== 'undefined' && window.innerWidth < 768 ? 900 : 2600} factor={2.2} saturation={.15} fade speed={.25} />
    </group>
  )
}

function CameraRig({ selected, selectedPosition, section }) {
  const { camera } = useThree()
  const desired = useRef(new THREE.Vector3())
  const lookAt = useRef(new THREE.Vector3())
  useFrame((_, delta) => {
    if (selected && selectedPosition) {
      desired.current.copy(selectedPosition).add(new THREE.Vector3(0,1.2,3.8))
      lookAt.current.copy(selectedPosition)
    } else {
      const positions = [[0,1.2,13.5],[2.4,2.2,11.5],[-2.5,1.2,14.5],[0,.5,9.5]]
      const p = positions[Math.min(section, positions.length-1)]
      desired.current.set(p[0],p[1],p[2])
      lookAt.current.set(section>=2?1:0,0,section>=2?-5:0)
    }
    camera.position.lerp(desired.current, 1-Math.pow(.01,delta))
    camera.lookAt(lookAt.current)
  })
  return null
}

function Scene({ selected, selectedPosition, onSelect, section }) {
  const coarsePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  return (
    <Canvas dpr={[1,1.6]} style={{touchAction:'pan-y'}} gl={{antialias:true,alpha:false,powerPreference:'high-performance'}} camera={{position:[0,1.2,13.5],fov:42,near:.1,far:100}}
      onCreated={({gl}) => { gl.setClearColor('#02040a'); gl.outputColorSpace=THREE.SRGBColorSpace; gl.toneMapping=THREE.ACESFilmicToneMapping; gl.toneMappingExposure=1.05 }}>
      <Suspense fallback={null}>
        <CameraRig selected={selected} selectedPosition={selectedPosition} section={section} />
        <SolarScene selected={selected} onSelect={onSelect} section={section} />
        {!selected && <OrbitControls enabled={!coarsePointer} enablePan={false} enableZoom={false} enableDamping dampingFactor={.05} minDistance={7} maxDistance={18} rotateSpeed={.35} />}
      </Suspense>
    </Canvas>
  )
}

export default function App() {
  const [selected,setSelected] = useState(null)
  const [selectedPosition,setSelectedPosition] = useState(null)
  const [section,setSection] = useState(0)
  const [progress,setProgress] = useState(0)
  const webglAvailable = useMemo(supportsWebGL, [])
  useEffect(() => {
    const handleScroll = () => {
      const max = document.documentElement.scrollHeight-window.innerHeight
      setProgress(max>0?window.scrollY/max:0)
      setSection(Math.min(3,Math.max(0,Math.round(window.scrollY/window.innerHeight))))
    }
    handleScroll()
    window.addEventListener('scroll',handleScroll,{passive:true})
    return () => window.removeEventListener('scroll',handleScroll)
  }, [])
  const selectPlanet = (planet,position) => { setSelected(planet); setSelectedPosition(position) }
  const goToSection = index => document.querySelectorAll('.journey-section')[index]?.scrollIntoView({behavior:'smooth'})
  const exploreAgain = () => { setSelected(null); setSelectedPosition(null); window.scrollTo({top:0,behavior:'smooth'}) }

  return (
    <main className="app-shell">
      <div className="canvas-wrap" aria-label="Interactive 3D planetary system">
        {webglAvailable ? <Scene selected={selected} selectedPosition={selectedPosition} onSelect={selectPlanet} section={section} /> :
          <div className="webgl-fallback">WebGL is unavailable. Please enable hardware acceleration to explore the 3D system.</div>}
      </div>
      <nav className="top-nav" aria-label="Primary navigation">
        <button className="brand" onClick={exploreAgain} aria-label="Return to the ORBIT hero"><span className="brand-mark"><span /></span><span>ORBIT</span></button>
        <div className="nav-index">
          {['SYSTEM','WORLDS','VOID','UNKNOWN'].map((label,i)=><button key={label} className={section===i?'active':''} onClick={()=>goToSection(i)}><span>0{i+1}</span>{label}</button>)}
        </div>
        <div className="status"><span /> SYSTEM ONLINE</div>
      </nav>
      <div className="scroll-progress" aria-hidden="true"><span style={{transform:`scaleY(${progress})`}} /></div>

      <AnimatePresence>
        {selected && <motion.aside className="planet-panel" initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} exit={{opacity:0,x:40}} transition={{duration:.45,ease:[.22,1,.36,1]}} aria-live="polite">
          <button className="return-button" onClick={()=>{setSelected(null);setSelectedPosition(null)}}><ArrowLeft size={14}/> RETURN TO SYSTEM</button>
          <div className="panel-heading"><span>CELESTIAL OBJECT</span><strong>{String(planets.indexOf(selected)+1).padStart(2,'0')}</strong></div>
          <h2>{selected.name}</h2><div className="classification">{selected.classification}</div>
          <dl>
            <div><dt>Fictional distance</dt><dd>{selected.distance}</dd></div>
            <div><dt>Temperature</dt><dd>{selected.temperature}</dd></div>
            <div><dt>Orbital period</dt><dd>{selected.period}</dd></div>
          </dl>
          <p>{selected.description}</p>
        </motion.aside>}
      </AnimatePresence>

      <div className="journey">
        <section className="journey-section hero-section">
          <motion.div className="hero-copy" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:1,delay:.25}}>
            <p className="eyebrow"><Crosshair size={13}/> FICTIONAL DEEP-SPACE ARCHIVE</p>
            <h1>BEYOND<br/>DIMENSIONS<span>.</span></h1>
            <p className="subtitle">An interactive journey through the unknown.</p>
            <button className="primary-button" onClick={()=>goToSection(1)}>EXPLORE UNIVERSE <ArrowRight size={16}/></button>
          </motion.div>
          <div className="hero-meta"><span>ORBITAL PLANE</span><strong>AX-2401</strong><span>OBJECTS</span><strong>04 DETECTED</strong></div>
          <button className="scroll-cue" onClick={()=>goToSection(1)}><span>SCROLL TO DISCOVER</span><ArrowDown size={16}/></button>
        </section>
        <section className="journey-section worlds-section">
          <motion.div className="section-copy" initial={{opacity:0}} whileInView={{opacity:1}} viewport={{amount:.4}} transition={{duration:.8}}>
            <p className="section-number">01 / WORLDS BEYOND</p><h2>FOUR WORLDS.<br/>ONE HORIZON.</h2>
            <p>Select a planet to enter its orbit. Each world exists only in the ORBIT fiction archive.</p>
          </motion.div>
        </section>
        <section className="journey-section deep-section">
          <motion.div className="section-copy right" initial={{opacity:0,x:30}} whileInView={{opacity:1,x:0}} viewport={{amount:.4}} transition={{duration:.8}}>
            <p className="section-number">02 / DEEP SPACE</p><h2>BEYOND THE<br/>KNOWN MAP.</h2>
            <p>Drifting asteroids mark the silent boundary between charted worlds and the next unknown.</p>
          </motion.div>
        </section>
        <section className="journey-section final-section">
          <motion.div className="final-copy" initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{amount:.5}} transition={{duration:1}}>
            <p className="section-number">03 / THE UNKNOWN</p><h2>THE UNIVERSE<br/>IS WAITING.</h2>
            <p>Your journey doesn&apos;t end here. It begins beyond what you know.</p>
            <button className="primary-button" onClick={exploreAgain}><RotateCcw size={16}/> EXPLORE AGAIN</button>
          </motion.div>
        </section>
      </div>
    </main>
  )
}

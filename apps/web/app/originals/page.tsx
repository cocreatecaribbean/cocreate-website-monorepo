import * as fonts from '@/styles/fonts'

const Originals: React.FC = () => {
  return (
    <main className="">
      <section className="flex flex-col items-center justify-center">
        <div
          className={`relative mb-60 h-fit w-fit pt-90 text-[clamp(3rem,5vw,7rem)] ${fonts.bricolage_grot600.className}`}
        >
          Originals
        </div>
      </section>
    </main>
  )
}

export default Originals

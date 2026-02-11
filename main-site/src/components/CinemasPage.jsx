import "./CinemasPage.css";
import plazaImg from "../assets/Cinemas/AbsolutePlaza.jpg";
import solarisImg from "../assets/Cinemas/AbsoluteSolaris.jpg";
import kristineImg from "../assets/Cinemas/AbsoluteKristine.jpg";
import cocaColaImg from "../assets/Cinemas/coca-cola-plaza.jpg";
import eedenImg from "../assets/Cinemas/AbsoluteEeden.jpg";
import parnuImg from "../assets/Cinemas/AbsolutePärnu.jpg";

const cinemas = [
  {
    id: "plaza",
    name: "Absolute Plaza",
    location: "Hobujaama 5 · Tallinn",
    description:
      "Absolute Plaza is located in the heart of Tallinn at Hobujaama 5, Tallinn. The cinema features several modern auditoriums equipped with large screens and high-quality sound systems, ensuring an immersive movie-going experience. It regularly hosts film premieres and special screenings, making it an important cultural venue in the city.",
    image: plazaImg,
  },
  {
    id: "solaris",
    name: "Absolute Kino Solaris",
    location: "Estonia pst 9 · Tallinn",
    description:
      "Absolute Kino Solaris is situated in the Solaris Shopping Centre at Estonia pst 9, Tallinn. The cinema is known for its contemporary design and comfortable auditoriums, all equipped with modern projection and sound technology. Its central location makes it a popular destination for both locals and visitors.",
    image: solarisImg,
  },
  {
    id: "kristine",
    name: "Absolute Kino Kristine",
    location: "Endla 45 · Tallinn",
    description:
      "Absolute Kino Kristine Keskus is located in the Kristiine Shopping Centre at Endla 45, Tallinn. The cinema focuses on providing a comfortable and family-friendly environment, with spacious auditoriums and convenient seating. It is a suitable choice for both daytime and evening movie screenings.",
    image: kristineImg,
  },
  {
    id: "cocacola",
    name: "Coca-Cola Plaza",
    location: "Hobujaama 5 · Tallinn",
    description:
      "Absolute Coca-Cola Plaza is located at Hobujaama 5, Tallinn. As one of the largest cinemas in the city, it offers multiple auditoriums and advanced cinema technologies. The venue is well known for hosting major film premieres and large-scale movie events.",
    image: cocaColaImg,
  },
  {
    id: "eeden",
    name: "Absolute Kino Eeden",
    location: "Kalda tee 1 · Tartu",
    description:
      "Absolute Eeden is located in the Eeden Shopping Centre at Kalda tee 1, Tartu. The cinema provides a calm and comfortable atmosphere with modern auditoriums and well-designed seating areas. It offers a wide selection of films and serves as a popular entertainment location for the local community.",
    image: eedenImg,
  },
  {
    id: "parnu",
    name: "Absolute Kino Pärnu",
    location: "Lai 11 · Pärnu",
    description:
      "Absolute Kino Pärnu is located in the Port Artur Shopping Centre at Lai 11, Pärnu. The cinema combines modern technical equipment with a convenient central location. It is especially popular among both residents and tourists, particularly during the summer season.",
    image: parnuImg,
  },
];

const CinemasPage = () => {
  return (
    <div className="cinemas-page">
      <div className="cinemas-heading">
        <p className="cinemas-eyebrow">Our cinemas</p>
        <h1>Cinemas</h1>
        <p className="cinemas-subtitle">
          Explore every Absolute location across Estonia. Each venue is tailored for clarity, comfort,
          and big-screen impact.
        </p>
      </div>

      <div className="cinemas-grid" aria-label="List of Absolute cinemas">
        {cinemas.map((cinema, index) => (
          <section
            key={cinema.id}
            className={`cinema-row ${index % 2 === 1 ? "reverse" : ""}`}
            aria-labelledby={`${cinema.id}-title`}
          >
            <div className="cinema-media">
              <img src={cinema.image} alt={cinema.name} loading="lazy" />
            </div>
            <div className="cinema-copy">
              <h3 id={`${cinema.id}-title`}>{cinema.name}</h3>
              <p className="cinema-location">{cinema.location}</p>
              <p className="cinema-description">{cinema.description}</p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default CinemasPage;

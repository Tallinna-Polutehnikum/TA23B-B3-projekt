import './Profile.css';

const mockUser = {
  name: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  memberSince: '2024-02-10',
  avatar: 'https://via.placeholder.com/120?text=User',
  favoriteGenres: ['Action', 'Drama', 'Sci-Fi'],
};

export default function Profile() {
  const { name, email, memberSince, avatar, favoriteGenres } = mockUser;

  return (
    <section className="profile">
      <div className="profile-card">
        <div className="profile-header">
          <img className="profile-avatar" src={avatar} alt={`${name} avatar`} />
          <div>
            <h2 className="profile-name">{name}</h2>
            <p className="profile-email">{email}</p>
            <p className="profile-meta">Member since {new Date(memberSince).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="profile-body">
          <h3>Favorite genres</h3>
          <div className="profile-tags">
            {favoriteGenres.map((genre) => (
              <span key={genre} className="profile-tag">{genre}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

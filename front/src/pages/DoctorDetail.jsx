import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import PageHero from '../components/PageHero/PageHero';
import '../styles/DoctorDetail.css';

const DoctorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [doctor, setDoctor] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getDoctor(id, token);
        if (res && res.status === 'success') setDoctor(res.doctor || res);
      } catch (e) {}
    };
    load();
  }, [id, token]);

  if (!doctor) return <div>Loading doctor...</div>;

  return (
    <div className="doctor-detail-page">
      <PageHero 
        title={doctor.name} 
        subtitle={`Healthcare professional at ${doctor.hospital?.name || 'our facility'}`}
      />
      <div className="doctor-detail">
        <header>
          <h1>{doctor.name}</h1>
          <p>Identifier: {doctor.identifier}</p>
          <p>Hospital: {doctor.hospital?.name || 'N/A'}</p>
        </header>

      <main>
        <section>
          <h2>About</h2>
          <p>{doctor.email}</p>
        </section>

        <section>
          <h2>Hospital</h2>
          {doctor.hospital ? (
            <div>
              <h3>{doctor.hospital.name}</h3>
              <p>{doctor.hospital.address}</p>
              <button onClick={() => navigate(`/hospitals/${doctor.hospital.id}`)} className="btn-primary">
                View Hospital & Book Appointment
              </button>
            </div>
          ) : (
            <p>No hospital assigned</p>
          )}
        </section>
      </main>
      </div>
    </div>
  );
};

export default DoctorDetail;

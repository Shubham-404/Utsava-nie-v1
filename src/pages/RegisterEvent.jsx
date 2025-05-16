import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

function RegisterEvent() {
  const { event_id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    usn: '',
    email: currentUser?.email || '',
    semester: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      toast.error('Please log in to register for events 😔');
      navigate('/login');
      return;
    }

    if (currentUser.role !== 'student') {
      toast.error('Only students can register for events 🚫');
      navigate('/');
      return;
    }

    const fetchEvent = async () => {
      try {
        const eventDoc = await getDoc(doc(db, 'events', event_id));
        if (eventDoc.exists()) {
          setEvent({ id: eventDoc.id, ...eventDoc.data() });
        } else {
          console.error('Event not found');
          toast.error('Event not found 😕');
          navigate('/404');
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        toast.error('Failed to load event details 😔');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [event_id, currentUser, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.usn || !formData.email || !formData.semester) {
      toast.error('Please fill all fields 📝');
      return;
    }

    try {
      // Create registration document
      const registration_id = `${event_id}_${formData.usn}`;
      const registrationData = {
        registration_id,
        event_id,
        name: formData.name,
        usn: formData.usn,
        email: formData.email,
        semester: formData.semester,
        timestamp: serverTimestamp(),
      };
      await setDoc(doc(db, 'registrations', registration_id), registrationData);

      // Increment event registrations count
      const eventRef = doc(db, 'events', event_id);
      await updateDoc(eventRef, {
        registrations: increment(1),
      });

      // Update student's profile with event_id
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        events_registered: arrayUnion(event_id),
      });

      toast.success('Registered successfully! 🎉');
      setFormData({ name: '', usn: '', email: currentUser.email, semester: '' });
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error('Failed to register. Please try again 😔');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-100">
        <div className="text-gray-600 text-lg animate-pulse">Loading Event... ⏳</div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 transform hover:scale-[1.02] transition-transform duration-300">
        <h2 className="text-3xl font-extrabold text-[#1D3557] mb-6 text-center">
          Register for {event.name} 🎉
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name 👤</label>
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D3557] focus:border-transparent transition-colors duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">USN 🎓</label>
            <input
              type="text"
              name="usn"
              placeholder="Your USN"
              value={formData.usn}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D3557] focus:border-transparent transition-colors duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email 📧</label>
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D3557] focus:border-transparent transition-colors duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester 📚</label>
            <input
              type="text"
              name="semester"
              placeholder="e.g., 5th Semester"
              value={formData.semester}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D3557] focus:border-transparent transition-colors duration-200"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#E63946] to-[#F63956] text-white py-3 rounded-full hover:from-[#F63956] hover:to-[#E63946] transition-all duration-300 shadow-md"
          >
            Register Now 🚀
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterEvent;
// Verbesserte Version des server.js mit optimierter Static-Serving-Logik und Pfadkorrekturen

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Statische Dateien bereitstellen ---
app.use(express.static(path.join(__dirname, '../frontend')));

// --- MongoDB Verbindung ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Erfolgreich mit MongoDB verbunden.'))
  .catch((err) => console.error('Verbindung zu MongoDB fehlgeschlagen:', err));

// --- User Schema und Model ---
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', UserSchema);

// --- API Routen ---
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'Benutzer erfolgreich registriert.' });
  } catch (error) {
    res.status(500).json({ message: 'Fehler bei der Registrierung.', error });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'Benutzer nicht gefunden.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ message: 'Ungültige Anmeldeinformationen.' });

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: 'Fehler beim Login.', error });
  }
});

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Authentifizierung fehlgeschlagen.' });
  }
};

app.get('/api/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Benutzerprofil konnte nicht abgerufen werden.' });
  }
});

// HINZUFÜGEN: Route zur Aktualisierung des Benutzerprofils (PUT)
app.put('/api/profile', auth, async (req, res) => {
  try {
    const { username, email } = req.body;
    // Finde den Benutzer über die ID aus dem JWT und aktualisiere ihn
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { username, email },
      { new: true } // Diese Option gibt das aktualisierte Dokument zurück
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
    }
    res.json(updatedUser);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Fehler beim Aktualisieren des Profils.', error });
  }
});

// HINZUFÜGEN: Route zur Löschung des Benutzerprofils (DELETE)
app.delete('/api/profile', auth, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user.userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
    }
    res.json({ message: 'Benutzer erfolgreich gelöscht.' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Fehler beim Löschen des Benutzers.', error });
  }
});

// Startseite ausliefern (z.B. index.html in /pages)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

// --- Server Start ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));

import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate, Link, useParams } from 'react-router-dom';
import FormBuilder from '../components/FormBuilder';
import { Trophy, ArrowLeft, Save, Plus, Upload, Loader2 } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

export default function AdminCreateCompetition() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [prizes, setPrizes] = useState('');
  const [type, setType] = useState('solo');
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [deadline, setDeadline] = useState(''); // Registration Deadline
  const [submissionStart, setSubmissionStart] = useState('');
  const [submissionEnd, setSubmissionEnd] = useState('');
  
  // Dynamic Sponsors List
  const [sponsors, setSponsors] = useState([]);
  const [newSponsorName, setNewSponsorName] = useState('');
  const [newSponsorLogo, setNewSponsorLogo] = useState('');
  const [newSponsorUrl, setNewSponsorUrl] = useState('');
  const [sponsorLogoFile, setSponsorLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [sponsorUploadError, setSponsorUploadError] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [signatureFile, setSignatureFile] = useState(null);
  
  // Custom fields from FormBuilder
  const [customFields, setCustomFields] = useState([
    { id: 'field_uni', label: 'University', type: 'text', required: true },
    { id: 'field_dept', label: 'Department', type: 'text', required: true }
  ]);
  
  const [rankingStructure, setRankingStructure] = useState([
    { placement: 1, title: 'Champion', points: 100 },
    { placement: 2, title: '1st Runner Up', points: 60 },
    { placement: 3, title: '2nd Runner Up', points: 40 }
  ]);
  const [hasRankingCol, setHasRankingCol] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if ranking_structure column exists in database
  useEffect(() => {
    async function checkColumn() {
      try {
        const { data, error } = await supabase.from('competitions').select('*').limit(1);
        if (!error && data && data.length > 0) {
          if ('ranking_structure' in data[0]) {
            setHasRankingCol(true);
          }
        } else {
          const { error: testErr } = await supabase.from('competitions').select('ranking_structure').limit(1);
          if (!testErr) {
            setHasRankingCol(true);
          }
        }
      } catch (e) {
        console.error('Error checking ranking_structure column:', e);
      }
    }
    checkColumn();
  }, []);

  // Load existing competition data if in Edit Mode
  useEffect(() => {
    if (!isEditMode) return;

    async function loadCompetition() {
      try {
        setFetchLoading(true);
        const { data, error: fetchErr } = await supabase
          .from('competitions')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (fetchErr) throw fetchErr;
        if (data) {
          setTitle(data.title || '');
          setDescription(data.description || '');
          setRules(data.rules || '');
          setPrizes(data.prizes || '');
          setType(data.type || 'solo');
          setMaxTeamSize(data.max_team_size || 4);
          
          if (data.deadline) {
            const date = new Date(data.deadline);
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            setDeadline(localDate.toISOString().slice(0, 16));
          }
          if (data.submission_start) {
            const date = new Date(data.submission_start);
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            setSubmissionStart(localDate.toISOString().slice(0, 16));
          }
          if (data.submission_end) {
            const date = new Date(data.submission_end);
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            setSubmissionEnd(localDate.toISOString().slice(0, 16));
          }
          setCustomFields(data.custom_fields || []);
          setSponsors(data.sponsors || []);
          setSignatureUrl(data.signature_url || '');
          if (data.ranking_structure) {
            setRankingStructure(data.ranking_structure);
          }
        }
      } catch (err) {
        console.error('Error fetching competition:', err.message);
        setError('Failed to load competition details.');
      } finally {
        setFetchLoading(false);
      }
    }

    loadCompetition();
  }, [id, isEditMode]);

  const handleAddSponsor = async () => {
    if (!newSponsorName.trim()) return;
    setUploadingLogo(true);
    setSponsorUploadError('');
    let uploadedLogoUrl = newSponsorLogo.trim() || null;

    try {
      if (sponsorLogoFile) {
        const compressedLogoFile = await compressImage(sponsorLogoFile, { maxWidth: 600, maxHeight: 600 });
        const fileExt = compressedLogoFile.name.split('.').pop();
        const fileName = `logo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `sponsors/${fileName}`;

        const { data, error: uploadErr } = await supabase.storage
          .from('challenge-submissions')
          .upload(filePath, compressedLogoFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadErr) throw uploadErr;

        const { data: { publicUrl } } = supabase.storage
          .from('challenge-submissions')
          .getPublicUrl(filePath);

        uploadedLogoUrl = publicUrl;
      }

      const newSponsor = {
        name: newSponsorName.trim(),
        logo_url: uploadedLogoUrl,
        website_url: newSponsorUrl.trim() || null
      };

      setSponsors([...sponsors, newSponsor]);
      setNewSponsorName('');
      setNewSponsorLogo('');
      setNewSponsorUrl('');
      setSponsorLogoFile(null);
    } catch (err) {
      console.error('Logo upload failed:', err.message);
      setSponsorUploadError('Failed to upload logo image.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveSponsor = (index) => {
    setSponsors(sponsors.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let finalSignatureUrl = signatureUrl;

      // Upload signature file if provided
      if (signatureFile) {
        const compressedSigFile = await compressImage(signatureFile, { maxWidth: 500, maxHeight: 200 });
        const fileExt = compressedSigFile.name.split('.').pop();
        const fileName = `sig_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `signatures/${fileName}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('challenge-submissions')
          .upload(filePath, compressedSigFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadErr) throw uploadErr;

        const { data: { publicUrl } } = supabase.storage
          .from('challenge-submissions')
          .getPublicUrl(filePath);

        finalSignatureUrl = publicUrl;
      }

      const payload = {
        title,
        description,
        rules,
        prizes,
        type,
        max_team_size: type === 'team' ? maxTeamSize : 1,
        deadline, // Compatibility field
        registration_deadline: deadline,
        submission_start: submissionStart || null,
        submission_end: submissionEnd || null,
        custom_fields: customFields,
        sponsors: sponsors,
        signature_url: finalSignatureUrl
      };

      if (hasRankingCol) {
        payload.ranking_structure = rankingStructure;
      }

      let query;
      if (isEditMode) {
        query = supabase
          .from('competitions')
          .update(payload)
          .eq('id', id);
      } else {
        query = supabase
          .from('competitions')
          .insert([{ ...payload, status: 'draft' }]);
      }

      const { error: queryErr } = await query;
      if (queryErr) throw queryErr;
      
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Failed to save competition.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Console
      </Link>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {isEditMode ? 'Edit Competition Details' : 'Create New Competition'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure segment description, rules, prizes, and custom dynamic form builder templates.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 text-red-700 dark:text-red-404 rounded-lg p-3 text-xs flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-555 dark:text-slate-404 uppercase tracking-wider block">
                Challenge Title
              </label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. EWU Robocup Season 2026"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-555 dark:text-slate-404 uppercase tracking-wider block">
                Registration Deadline
              </label>
              <input
                required
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-555 dark:text-slate-404 uppercase tracking-wider block">
                Submission Window Start Time
              </label>
              <input
                required
                type="datetime-local"
                value={submissionStart}
                onChange={(e) => setSubmissionStart(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-555 dark:text-slate-404 uppercase tracking-wider block">
                Submission Window End Time
              </label>
              <input
                required
                type="datetime-local"
                value={submissionEnd}
                onChange={(e) => setSubmissionEnd(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-555 dark:text-slate-404 uppercase tracking-wider block">
                Participation Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white"
              >
                <option value="solo">Solo Participant</option>
                <option value="team">Team Segment</option>
              </select>
            </div>

            {type === 'team' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-404 uppercase tracking-wider block">
                  Max Team Size
                </label>
                <input
                  required
                  type="number"
                  min="2"
                  max="10"
                  value={maxTeamSize}
                  onChange={(e) => setMaxTeamSize(parseInt(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-555 dark:text-slate-404 uppercase tracking-wider block">
              Description
            </label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white min-h-[100px]"
              placeholder="What is this challenge about? Outline details here..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-555 dark:text-slate-404 uppercase tracking-wider block">
                Rulebook & Guidelines
              </label>
              <textarea
                required
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white min-h-[150px]"
                placeholder="1. Submissions must be original..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-555 dark:text-slate-404 uppercase tracking-wider block">
                Prizes & Recognition
              </label>
              <textarea
                required
                value={prizes}
                onChange={(e) => setPrizes(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white min-h-[150px]"
                placeholder="🥇 Winner: $1,000..."
              />
            </div>
          </div>

          {/* Organizer Signature Section */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-850 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Official Organizer Signature</h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload the signature of the lead organizer. This signature will be placed on generated participation and winner certificates.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-404 uppercase tracking-wider block">
                    Upload Signature Image (Recommended: 300x120 px, Transparent PNG)
                  </label>
                  {signatureFile ? (
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-xs">
                      <span className="truncate font-semibold text-slate-700 dark:text-slate-300">{signatureFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setSignatureFile(null)}
                        className="text-red-500 hover:text-red-700 font-bold ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste Signature Image URL (Optional)"
                        value={signatureUrl}
                        onChange={(e) => setSignatureUrl(e.target.value)}
                        className="flex-grow bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white"
                      />
                      <label className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-3 rounded-lg text-sm font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1.5">
                        <Upload className="w-4 h-4" />
                        Upload File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              setSignatureFile(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center p-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 min-h-[90px]">
                  {signatureFile ? (
                    <div className="text-center space-y-1">
                      <img
                        src={URL.createObjectURL(signatureFile)}
                        alt="Signature Preview"
                        className="max-h-[60px] object-contain mx-auto"
                      />
                      <span className="text-[10px] text-slate-400">Selected Signature Preview</span>
                    </div>
                  ) : signatureUrl ? (
                    <div className="text-center space-y-1">
                      <img
                        src={signatureUrl}
                        alt="Signature Preview"
                        className="max-h-[60px] object-contain mx-auto"
                      />
                      <span className="text-[10px] text-slate-400">Saved Signature Preview</span>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-slate-400">
                      No signature uploaded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sponsors Section */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-850 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Competition Sponsors</h3>
              <p className="text-xs text-slate-500 mt-1">Add sponsors specific to this challenge segment. They will be displayed on the details page, user badges, and certificates.</p>
            </div>
            
            {sponsorUploadError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 text-red-700 dark:text-red-400 rounded-lg p-2.5 text-[11px]">
                {sponsorUploadError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sponsor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Google Cloud"
                  value={newSponsorName}
                  onChange={(e) => setNewSponsorName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sponsor Logo (File or URL)</label>
                {sponsorLogoFile ? (
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs h-8">
                    <span className="truncate font-semibold text-slate-700 dark:text-slate-300 max-w-[120px]">{sponsorLogoFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setSponsorLogoFile(null)}
                      className="text-red-500 hover:text-red-700 font-bold ml-2 shrink-0"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Paste Image URL"
                      value={newSponsorLogo}
                      onChange={(e) => setNewSponsorLogo(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                    />
                    <label className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-205 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            setSponsorLogoFile(e.target.files[0]);
                            setNewSponsorLogo('');
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Website Link (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={newSponsorUrl}
                    onChange={(e) => setNewSponsorUrl(e.target.value)}
                    className="w-full flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddSponsor}
                    disabled={uploadingLogo}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-bold px-3 py-2 rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* List of current sponsors */}
            {sponsors.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {sponsors.map((sp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 truncate">
                      {sp.logo_url ? (
                        <img src={sp.logo_url} alt={sp.name} className="w-6 h-6 object-contain rounded border border-slate-100 bg-slate-50" onError={(e) => { e.target.style.display = 'none'; }} />
                      ) : (
                        <div className="w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                          {sp.name[0].toUpperCase()}
                        </div>
                      )}
                      <div className="truncate">
                        <p className="text-xs font-bold truncate">{sp.name}</p>
                        {sp.website_url && (
                          <a href={sp.website_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 hover:underline truncate block">
                            {sp.website_url.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSponsor(idx)}
                      className="text-xs font-bold text-red-500 hover:text-red-700 px-2"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Ranking structure config */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-850 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Ranks Standings & Score Schema</h3>
              <p className="text-xs text-slate-500 mt-1">
                Define the available ranks and point values for this segment. These ranks will be selectable when declaring winners.
              </p>
            </div>

            <div className="space-y-3">
              {rankingStructure.map((rank, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-slate-50/50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-200 dark:border-slate-850">
                  <div className="w-full sm:w-20 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Placement</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={rank.placement}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        const newRanks = [...rankingStructure];
                        newRanks[index].placement = val;
                        setRankingStructure(newRanks);
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                    />
                  </div>

                  <div className="w-full flex-grow space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rank Title (e.g. Champion, Best Research, Best Innovator)</label>
                    <input
                      type="text"
                      required
                      value={rank.title}
                      onChange={(e) => {
                        const newRanks = [...rankingStructure];
                        newRanks[index].title = e.target.value;
                        setRankingStructure(newRanks);
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                    />
                  </div>

                  <div className="w-full sm:w-24 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Points</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={rank.points}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        const newRanks = [...rankingStructure];
                        newRanks[index].points = val;
                        setRankingStructure(newRanks);
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setRankingStructure(rankingStructure.filter((_, i) => i !== index));
                    }}
                    className="text-xs font-bold text-red-500 hover:text-red-750 px-2 py-2 shrink-0 self-end sm:self-auto cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const maxPlacement = rankingStructure.reduce((max, r) => r.placement > max ? r.placement : max, 0);
                  setRankingStructure([
                    ...rankingStructure,
                    { placement: maxPlacement + 1, title: `Runner Up ${maxPlacement + 1}`, points: Math.max(0, 50 - maxPlacement * 10) }
                  ]);
                }}
                className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Custom Rank Standing
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-850">
            <FormBuilder
              fields={customFields}
              onChange={setCustomFields}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-75"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-5 h-5" /> {isEditMode ? 'Save Competition Changes' : 'Save Challenge Draft'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetAdvertisementsQuery,
  useCreateAdvertisementMutation,
  useUpdateAdvertisementMutation,
  useDeleteAdvertisementMutation,
  useTrackClickMutation
} from '../../store/api/advertisementApi.js';
import { hasEffectivePermission } from '../../utils/permissions.js';
import { extractApiError } from '../../utils/apiNormalizer.js';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import {
  Megaphone,
  Plus,
  Search,
  Play,
  Pause,
  Eye,
  MousePointerClick,
  X,
  Trash2,
  Edit3,
  ShieldAlert,
  TrendingUp,
  Layout,
  Filter,
  Wallet
} from 'lucide-react';
import Table from '../../components/Table.jsx';
import sweetAlert from '../../utils/sweetAlert.js';

const PLACEMENT_OPTIONS = [
  { id: 'homepage_top', nameBn: 'হোমপেজ শীর্ষ ব্যানার (Homepage Top)', dimensions: '728x90', slot: 'Homepage Top Leaderboard' },
  { id: 'homepage_sidebar', nameBn: 'হোমপেজ সাইডবার স্টিকি ব্যানার (Homepage Sidebar)', dimensions: '300x250', slot: 'Homepage Sidebar Rectangle' },
  { id: 'news_details_top', nameBn: 'নিউজ বিস্তারিত শীর্ষ ব্যানার (News Details Top)', dimensions: '728x90', slot: 'Article Header Banner' },
  { id: 'news_details_middle', nameBn: 'সংবাদের মাঝের ব্যানার (News Details Middle)', dimensions: '600x120', slot: 'In-Article Native' },
  { id: 'category_page', nameBn: 'ক্যাটাগরি পেজ ব্যানার (Category Page)', dimensions: '728x90', slot: 'Category Feed Leaderboard' }
];

const getDefaultDates = () => {
  const start = new Date();
  const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
};

export function AdminAdsPage() {
  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);
  const canManageAds = hasEffectivePermission(authState, adminState, 'ads.manage');

  const { data: adsResponse, isLoading: isAdsLoading, isFetching, isError, error, refetch } = useGetAdvertisementsQuery({
    per_page: 100
  });
  const [createAd, { isLoading: isCreating }] = useCreateAdvertisementMutation();
  const [updateAd, { isLoading: isUpdating }] = useUpdateAdvertisementMutation();
  const [deleteAd] = useDeleteAdvertisementMutation();
  const [trackClick] = useTrackClickMutation();

  const ads = useMemo(
    () => adsResponse?.items || adsResponse?.data || (Array.isArray(adsResponse) ? adsResponse : []),
    [adsResponse]
  );

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [placementFilter, setPlacementFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const initialDates = useMemo(() => getDefaultDates(), []);
  const getInitialFormState = () => ({
    title: '',
    advertiser: '',
    placement: 'homepage_top',
    image: '',
    destinationUrl: 'https://',
    budget: '50000',
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
    status: 'active'
  });

  // Modals & UI feedback
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [previewAd, setPreviewAd] = useState(null);
  const [authError, setAuthError] = useState('');
  const [formState, setFormState] = useState(getInitialFormState);
  const isSaving = isCreating || isUpdating;

  // Filtering
  const filteredAds = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ads.filter((a) => {
      const matchesSearch =
        !q ||
        (a.title || '').toLowerCase().includes(q) ||
        (a.advertiser || '').toLowerCase().includes(q);

      const matchesPlacement = placementFilter === 'all' || a.placement === placementFilter;
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;

      return matchesSearch && matchesPlacement && matchesStatus;
    });
  }, [ads, searchQuery, placementFilter, statusFilter]);

  // Metrics
  const totalImpressions = ads.reduce((sum, a) => sum + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, a) => sum + (a.clicks || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const activeCampaigns = ads.filter((a) => a.status === 'active').length;

  const ensureCanManageAds = async (deniedMsg) => {
    if (canManageAds) return true;
    setAuthError(deniedMsg);
    await sweetAlert.error('অনুমতি নেই', deniedMsg);
    return false;
  };

  const openCreateModal = async () => {
    setAuthError('');
    if (!(await ensureCanManageAds('আপনার বিজ্ঞাপন ক্যাম্পেইন তৈরির অনুমতি নেই।'))) return;
    setEditingAd(null);
    setFormState(getInitialFormState());
    setShowModal(true);
  };

  const openEditModal = (ad) => {
    setAuthError('');
    setEditingAd(ad);
    setFormState({
      title: ad.title || '',
      advertiser: ad.advertiser_name || ad.advertiser || '',
      placement: ad.placement || 'homepage_top',
      image: ad.image_url || ad.image || '',
      destinationUrl: ad.destination_url || ad.destinationUrl || 'https://',
      budget: ad.budget ?? '0',
      startDate: ad.startDate || initialDates.startDate,
      endDate: ad.endDate || initialDates.endDate,
      status: ad.status || 'active'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAd(null);
  };

  const notifyAdError = async (err, titleText, fallbackText) => {
    const msg = extractApiError(err, fallbackText);
    setAuthError(msg);
    await sweetAlert.error(titleText, msg);
  };

  // Toggle status via Laravel API
  const handleToggle = async (ad) => {
    setAuthError('');
    if (!(await ensureCanManageAds('বিজ্ঞাপন স্থিতি পরিবর্তনের অনুমতি আপনার নেই।'))) return;

    const nextStatus = ad.status === 'active' ? 'paused' : 'active';
    try {
      await updateAd({ id: ad.id, status: nextStatus, placement: ad.placement }).unwrap();
      await sweetAlert.success(
        'স্থিতি পরিবর্তিত হয়েছে!',
        `"${ad.title}" ক্যাম্পেইনের স্থিতি পরিবর্তন করা হয়েছে।`
      );
    } catch (err) {
      await notifyAdError(err, 'পরিবর্তন ব্যর্থ হয়েছে', 'স্থিতি পরিবর্তন করা যায়নি।');
    }
  };

  // Create / Update Campaign via Laravel API
  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    const deniedMsg = editingAd
      ? 'বিজ্ঞাপন সম্পাদনার অনুমতি আপনার নেই।'
      : 'নতুন বিজ্ঞাপন ক্যাম্পেইন তৈরির অনুমতি আপনার নেই।';
    if (!(await ensureCanManageAds(deniedMsg))) return;

    const trimmedTitle = formState.title.trim();
    const trimmedAdvertiser = formState.advertiser.trim();
    if (!trimmedTitle || !trimmedAdvertiser) return;

    const payload = {
      title: trimmedTitle,
      advertiser_name: trimmedAdvertiser,
      placement: formState.placement,
      image_url:
        formState.image.trim() ||
        'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=728&h=90&fit=crop&q=80',
      destination_url: formState.destinationUrl.trim() || 'https://dailyprabaho.com',
      start_date: formState.startDate,
      end_date: formState.endDate,
      status: editingAd ? formState.status : 'active',
      budget: Number(formState.budget) || 0
    };

    try {
      if (editingAd) {
        await updateAd({ id: editingAd.id, ...payload }).unwrap();
        closeModal();
        await sweetAlert.success(
          'ক্যাম্পেইন হালনাগাদ হয়েছে!',
          `"${trimmedTitle}" এর তথ্য সফলভাবে সংরক্ষিত হয়েছে।`
        );
      } else {
        await createAd(payload).unwrap();
        closeModal();
        setFormState(getInitialFormState());
        await sweetAlert.success(
          'নতুন ক্যাম্পেইন তৈরি হয়েছে!',
          `ক্যাম্পেইন "${trimmedTitle}" সফলভাবে সক্রিয় হয়েছে।`
        );
      }
    } catch (err) {
      await notifyAdError(
        err,
        editingAd ? 'হালনাগাদ ব্যর্থ হয়েছে' : 'তৈরি ব্যর্থ হয়েছে',
        editingAd ? 'বিজ্ঞাপন হালনাগাদ করা যায়নি।' : 'বিজ্ঞাপন ক্যাম্পেইন তৈরি করা যায়নি।'
      );
    }
  };

  // Delete Campaign via Laravel API
  const handleDelete = async (ad) => {
    setAuthError('');
    if (!(await ensureCanManageAds('বিজ্ঞাপন মুছে ফেলার অনুমতি আপনার নেই।'))) return;

    const { isConfirmed } = await sweetAlert.confirmDelete(
      ad.title,
      `আপনি কি "${ad.title}" ক্যাম্পেইনটি স্থায়ীভাবে মুছে ফেলতে চান?`
    );
    if (!isConfirmed) {
      return;
    }

    try {
      await deleteAd(ad.id).unwrap();
      await sweetAlert.success('অপসারিত হয়েছে!', 'বিজ্ঞাপন ক্যাম্পেইন সফলভাবে মুছে ফেলা হয়েছে।');
    } catch (err) {
      await notifyAdError(err, 'মুছে ফেলা যায়নি', 'ক্যাম্পেইন মুছে ফেলা যায়নি।');
    }
  };

  // Real click tracking call to Laravel API
  const handleTestClick = async (ad) => {
    try {
      await trackClick(ad.id).unwrap();
      const { data: freshAds } = await refetch();
      const latest = freshAds?.items?.find((item) => item.id === ad.id);
      if (latest) {
        setPreviewAd(latest);
      }
      await sweetAlert.success(
        'ক্লিক ট্র্যাক হয়েছে!',
        'ক্লিক ট্র্যাকিং লারাভেল সার্ভারে নথিভুক্ত হয়েছে এবং CTR হালনাগাদ হয়েছে।'
      );
    } catch (err) {
      await sweetAlert.error('ট্র্যাকিং ব্যর্থ হয়েছে', extractApiError(err, 'ক্লিক ট্র্যাক করা যায়নি।'));
    }
  };

  const columns = [
    {
      header: 'ক্যাম্পেইন ও বিজ্ঞাপনদাতা',
      accessor: 'title',
      render: (row) => {
        const option = PLACEMENT_OPTIONS.find((p) => p.id === row.placement);
        return (
          <div className="flex items-center gap-3">
            <img
              src={row.image}
              alt={row.title}
              className="w-14 h-10 rounded-lg object-cover ring-1 ring-stone-200 shrink-0"
            />
            <div>
              <p className="font-bold text-stone-900 text-xs font-serif-bn line-clamp-1">{row.title}</p>
              <p className="text-[11px] text-stone-500 font-medium">{row.advertiser}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-rose-50 text-rose-700 rounded border border-rose-200">
                  {option?.dimensions || '728x90'}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">{row.placement}</span>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'বিজ্ঞাপন স্লট (Placement)',
      accessor: 'placement',
      render: (row) => {
        const option = PLACEMENT_OPTIONS.find((p) => p.id === row.placement);
        return (
          <div>
            <span className="text-xs font-semibold text-stone-800 block">
              {option?.nameBn || row.placement}
            </span>
            <span className="text-[10px] text-stone-400 font-mono">
              {option?.slot || row.placement}
            </span>
          </div>
        );
      }
    },
    {
      header: 'মেয়াদকাল (Schedule)',
      accessor: 'startDate',
      render: (row) => (
        <div className="text-[11px] font-mono text-stone-600">
          <p className="flex items-center gap-1">
            <span className="text-stone-400">শুরু:</span> {row.startDate || '—'}
          </p>
          <p className="flex items-center gap-1">
            <span className="text-stone-400">শেষ:</span> {row.endDate || '—'}
          </p>
        </div>
      )
    },
    {
      header: 'ইম্প্রেশন ও ক্লিক ট্র্যাকিং',
      accessor: 'impressions',
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="inline-flex items-center gap-1 text-stone-700">
              <Eye className="w-3.5 h-3.5 text-stone-400" />
              <strong>{toBengaliNumber(row.impressions)}</strong>
            </span>
            <span className="inline-flex items-center gap-1 text-stone-700">
              <MousePointerClick className="w-3.5 h-3.5 text-rose-500" />
              <strong>{toBengaliNumber(row.clicks)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono">
            <span className="text-stone-400">সিটিআর (CTR):</span>
            <span className="font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
              {row.ctr}%
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'অবস্থা (Status)',
      accessor: 'status',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
            row.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'active' ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`} />
          <span>{row.status === 'active' ? 'সক্রিয়' : 'স্থগিত'}</span>
        </span>
      )
    },
    {
      header: 'অ্যাকশন ও নিয়ন্ত্রণ',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setPreviewAd(row)}
            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer"
            title="লাইভ প্রিভিউ ও ক্লিক ট্র্যাকিং"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer"
            title="সম্পাদনা"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleToggle(row)}
            className={`p-1.5 rounded-lg border cursor-pointer ${
              row.status === 'active'
                ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            }`}
            title={row.status === 'active' ? 'স্থগিত করুন' : 'সক্রিয় করুন'}
          >
            {row.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row)}
            className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
            title="মুছে ফেলুন"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {(authError || isError) && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">
              {authError || extractApiError(error, 'বিজ্ঞাপনের তালিকা লোড করা যায়নি।')}
            </span>
          </div>
          {authError && (
            <button
              type="button"
              onClick={() => setAuthError('')}
              className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
            >
              বন্ধ করুন
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black font-serif-bn text-stone-900">
            বিজ্ঞাপন ও ক্যাম্পেইন ব্যবস্থাপনা (Ad Server)
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            ৫টি প্রধান ওয়েবসাইট স্লটে বিজ্ঞাপনের অবস্থান, ক্রিয়েটিভ ব্যানার ও লাইভ ক্লিক-ইম্প্রেশন ট্র্যাকিং
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/monetization"
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Wallet className="w-4 h-4" />
            <span>ক্যাম্পেইন, বিজ্ঞাপনদাতা ও আয় রিপোর্ট কেন্দ্র</span>
          </Link>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন বিজ্ঞাপন ক্যাম্পেইন</span>
          </button>
        </div>
      </div>

      {/* Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-stone-500 uppercase">মোট ইম্প্রেশন</p>
            <h3 className="text-xl font-bold font-mono text-stone-900 mt-1">
              {toBengaliNumber(totalImpressions)}
            </h3>
            <span className="text-[10px] text-emerald-600 font-semibold font-mono">লাইভ ডেলিভারি</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-stone-500 uppercase">মোট ক্লিক সংখ্যা</p>
            <h3 className="text-xl font-bold font-mono text-stone-900 mt-1">
              {toBengaliNumber(totalClicks)}
            </h3>
            <span className="text-[10px] text-rose-600 font-semibold font-mono">আগ্রহী পাঠক</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <MousePointerClick className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-stone-500 uppercase">গড় সিটিআর (CTR)</p>
            <h3 className="text-xl font-bold font-mono text-emerald-600 mt-1">
              {avgCtr}%
            </h3>
            <span className="text-[10px] text-stone-400 font-mono">মানসম্পন্ন ফলাফল</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-stone-500 uppercase">সক্রিয় ক্যাম্পেইন</p>
            <h3 className="text-xl font-bold font-mono text-stone-900 mt-1">
              {toBengaliNumber(activeCampaigns)} / {toBengaliNumber(ads.length)}
            </h3>
            <span className="text-[10px] text-stone-500 font-mono">৫টি স্লটে রানিং</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
            <Megaphone className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 5 Specific Placements Status Strip */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-rose-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 font-mono">
              ৫টি নির্ধারিত বিজ্ঞাপনী স্লটের বর্তমান অবস্থা (5 Placements Monitor)
            </h3>
          </div>
          <span className="text-[10px] text-stone-400 font-mono">স্বয়ংক্রিয় রোটেশন সক্রিয়</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {PLACEMENT_OPTIONS.map((slot) => {
            const matchedAd = ads.find((a) => a.placement === slot.id && a.status === 'active');
            return (
              <div
                key={slot.id}
                className={`p-3 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                  matchedAd ? 'bg-emerald-50/40 border-emerald-200' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-stone-500 block truncate">
                    {slot.dimensions} • {slot.id}
                  </span>
                  <h4 className="font-bold text-stone-900 mt-0.5 line-clamp-1 font-serif-bn">
                    {slot.nameBn.split('(')[0]}
                  </h4>
                </div>

                <div className="mt-2 pt-2 border-t border-stone-200/60 flex items-center justify-between">
                  {matchedAd ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                      <span className="truncate">{matchedAd.advertiser}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400 italic">স্লট খালি</span>
                  )}
                  {matchedAd && (
                    <span className="text-[9px] font-mono text-stone-500 shrink-0">
                      CTR: {matchedAd.ctr}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ক্যাম্পেইনের নাম বা বিজ্ঞাপনদাতা দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <select
            value={placementFilter}
            onChange={(e) => setPlacementFilter(e.target.value)}
            className="text-xs border border-stone-200 rounded-xl px-3 py-2 bg-stone-50 focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="all">সকল প্লেসমেন্ট (All Placements)</option>
            {PLACEMENT_OPTIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nameBn}
              </option>
            ))}
          </select>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-stone-200 rounded-xl px-3 py-2 bg-stone-50 focus:bg-white focus:outline-none cursor-pointer"
        >
          <option value="all">সকল অবস্থা (Status)</option>
          <option value="active">সক্রিয় (Active)</option>
          <option value="paused">স্থগিত (Paused)</option>
        </select>
      </div>

      {/* Table */}
      <Table columns={columns} data={filteredAds} isLoading={isAdsLoading || isFetching} />

      {/* LIVE AD PREVIEW MODAL */}
      {previewAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold border border-rose-200">
                  {previewAd.placement}
                </span>
                <h3 className="text-base font-bold font-serif-bn text-stone-900 mt-1">
                  লাইভ ক্রিয়েটিভ প্রিভিউ: {previewAd.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAd(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-stone-100 p-4 rounded-2xl border border-stone-200 text-center space-y-2">
              <span className="text-[10px] text-stone-400 font-mono uppercase">
                ওয়েবসাইট ভিউ (Slot: {previewAd.placement})
              </span>
              <div className="mx-auto flex justify-center overflow-hidden rounded-xl shadow-md border border-stone-300">
                <img
                  src={previewAd.image}
                  alt={previewAd.title}
                  className="max-w-full max-h-56 object-cover"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                <span className="text-[10px] text-stone-400 block">মোট ইম্প্রেশন</span>
                <strong className="text-stone-900">{toBengaliNumber(previewAd.impressions)}</strong>
              </div>
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                <span className="text-[10px] text-stone-400 block">মোট ক্লিক</span>
                <strong className="text-rose-600">{toBengaliNumber(previewAd.clicks)}</strong>
              </div>
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                <span className="text-[10px] text-stone-400 block">লাইভ সিটিআর</span>
                <strong className="text-emerald-600">{previewAd.ctr}%</strong>
              </div>
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                <span className="text-[10px] text-stone-400 block">বাজেট</span>
                <strong className="text-stone-800">{previewAd.revenue}</strong>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl text-xs space-y-1 text-stone-600">
              <p><strong>বিজ্ঞাপনদাতা:</strong> {previewAd.advertiser}</p>
              <p><strong>টার্গেট ইউআরএল:</strong> <a href={previewAd.destinationUrl} target="_blank" rel="noreferrer" className="text-rose-700 underline font-mono break-all">{previewAd.destinationUrl}</a></p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleTestClick(previewAd)}
                className="py-2.5 px-4 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <MousePointerClick className="w-4 h-4 text-rose-400" />
                <span>ক্লিক ট্র্যাকিং টেস্ট করুন (CTR +1)</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewAd(null)}
                className="py-2.5 px-4 border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold rounded-xl cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CAMPAIGN MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold font-serif-bn text-stone-900">
                  {editingAd ? 'বিজ্ঞাপন ক্যাম্পেইন সম্পাদনা' : 'নতুন বিজ্ঞাপন ক্যাম্পেইন তৈরি'}
                </h3>
                <p className="text-[11px] text-stone-500">
                  {editingAd
                    ? editingAd.title
                    : 'বিজ্ঞাপনদাতা ও ক্রিয়েটিভ ব্যানার প্লেসমেন্ট কনফিগারেশন'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ক্যাম্পেইনের নাম (Campaign Title)
                </label>
                <input
                  type="text"
                  required
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  placeholder="যেমন: গ্রামীণফোন ৫জি সুপার ফাস্ট ইন্টারনেট"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  বিজ্ঞাপনদাতা প্রতিষ্ঠান (Advertiser Name)
                </label>
                <input
                  type="text"
                  required
                  value={formState.advertiser}
                  onChange={(e) => setFormState({ ...formState, advertiser: e.target.value })}
                  placeholder="যেমন: Grameenphone Ltd."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  বিজ্ঞাপনের নির্ধারিত অবস্থান (Placement Slot)
                </label>
                <select
                  value={formState.placement}
                  onChange={(e) => setFormState({ ...formState, placement: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
                >
                  {PLACEMENT_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameBn} [{p.dimensions}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ক্রিয়েটিভ ব্যানার ইমেজ ইউআরএল (Creative Banner URL)
                </label>
                <input
                  type="url"
                  required
                  value={formState.image}
                  onChange={(e) => setFormState({ ...formState, image: e.target.value })}
                  placeholder="https://... ব্যানার ছবির লিংক"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ক্লিক ডেস্টিনেশন লিংক (Target Destination URL)
                </label>
                <input
                  type="url"
                  required
                  value={formState.destinationUrl}
                  onChange={(e) => setFormState({ ...formState, destinationUrl: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    শুরুর তারিখ
                  </label>
                  <input
                    type="date"
                    required
                    value={formState.startDate}
                    onChange={(e) => setFormState({ ...formState, startDate: e.target.value })}
                    className="w-full px-2 py-2 border border-stone-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    সমাপ্তির তারিখ
                  </label>
                  <input
                    type="date"
                    required
                    value={formState.endDate}
                    onChange={(e) => setFormState({ ...formState, endDate: e.target.value })}
                    className="w-full px-2 py-2 border border-stone-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    বাজেট (BDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formState.budget}
                    onChange={(e) => setFormState({ ...formState, budget: e.target.value })}
                    placeholder="50000"
                    className="w-full px-2 py-2 border border-stone-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>
                    {isSaving
                      ? 'সংরক্ষণ হচ্ছে...'
                      : editingAd
                        ? 'তথ্য সংরক্ষণ করুন'
                        : 'ক্যাম্পেইন সক্রিয় করুন'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAdsPage;

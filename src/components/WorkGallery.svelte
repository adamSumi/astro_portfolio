<script lang="ts">
  export interface ArtifactItem {
    id: string;
    title: string;
    description: string;
    tags: string[];
    link?: string | null;
    showLiveLink?: boolean;
    date?: string | null;
    showDate?: boolean;
    order?: number | null;
    featured?: boolean;
    previewImage?: string;
    metrics?: string;
    mediaType?: 'image' | 'video' | 'document';
    videoUrl?: string;
    galleryImages?: string[];
    body?: string;
  }

  let { artifacts = [] }: { artifacts: ArtifactItem[] } = $props();

  let selectedTag = $state('All');
  let searchQuery = $state('');
  let activeArtifact = $state<ArtifactItem | null>(null);
  let modalHeroImage = $state<string | null>(null);
  let dialogRef = $state<HTMLDialogElement | null>(null);

  // Derive unique tags from artifacts
  let allTags = $derived([
    'All',
    ...Array.from(new Set(artifacts.flatMap((a) => a.tags || []))).sort()
  ]);

  // Real-time filtered artifacts based on selected tag and search query
  let filteredArtifacts = $derived(
    artifacts.filter((item) => {
      const matchesTag = selectedTag === 'All' || (item.tags && item.tags.includes(selectedTag));
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesTag;

      const matchesQuery =
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q))) ||
        (item.metrics && item.metrics.toLowerCase().includes(q));

      return matchesTag && matchesQuery;
    })
  );

  function openModal(item: ArtifactItem) {
    activeArtifact = item;
    modalHeroImage = item.previewImage || null;
    if (dialogRef) {
      dialogRef.showModal();
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (dialogRef && dialogRef.open) {
      dialogRef.close();
    }
    document.body.style.overflow = '';
  }

  function handleBackdropClick(event: MouseEvent) {
    if (dialogRef && event.target === dialogRef) {
      closeModal();
    }
  }

  function handleDialogClose() {
    document.body.style.overflow = '';
  }

  function getEmbedUrl(url: string = ''): { type: 'youtube' | 'vimeo' | 'video' | 'none'; src: string } {
    if (!url) return { type: 'none', src: '' };
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return { type: 'youtube', src: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0` };
    }
    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      return { type: 'vimeo', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
    }
    // Direct video (.mp4, .webm, or local path)
    if (url.match(/\.(mp4|webm|ogg)($|\?)/i) || url.startsWith('/videos/')) {
      return { type: 'video', src: url };
    }
    return { type: 'none', src: url };
  }

  function renderFormattedBody(markdown: string = ''): string {
    if (!markdown) return '';
    return markdown
      // Markdown Images: ![alt](url)
      .replace(/!\[(.*?)\]\((.*?)\)/g, (_match, alt, src) => {
        const captionHtml = alt
          ? `<figcaption class="py-2.5 px-4 text-center text-xs font-mono text-stone-600 bg-white/95 border-t border-stone-200/80 flex items-center justify-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-stone-400 inline-block"></span>${alt}</figcaption>`
          : '';
        return `<figure class="my-6 rounded-xl overflow-hidden border border-stone-200/90 bg-stone-50 shadow-sm transition-all hover:shadow-md">
          <img src="${src}" alt="${alt || 'Artifact collateral visual'}" class="w-full h-auto object-cover max-h-[440px] block" loading="lazy" />
          ${captionHtml}
        </figure>`;
      })
      // Markdown Links: [text](url)
      .replace(/(?<!\!)\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-stone-900 underline underline-offset-2 font-semibold hover:text-stone-600 transition-colors">$1</a>')
      // Headings
      .replace(/^### (.*$)/gim, '<h4 class="font-serif text-lg font-bold text-stone-900 mt-7 mb-2.5 flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-stone-700 inline-block"></span>$1</h4>')
      .replace(/^## (.*$)/gim, '<h3 class="font-serif text-xl font-bold text-stone-900 mt-8 mb-3.5 border-b border-stone-200 pb-1.5">$1</h3>')
      // Typography
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-stone-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-stone-800">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 font-mono text-xs border border-stone-200">$1</code>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-stone-700 mb-2 leading-relaxed marker:text-stone-400">$1</li>')
      .replace(/\n\n/g, '<div class="h-3"></div>');
  }
</script>

<div class="w-full">
  <!-- Curatorial Filter & Search Bar -->
  <div class="mb-10 space-y-6">
    <div class="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
      <!-- Search Input -->
      <div class="relative flex-1 max-w-md">
        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search by campaign, channel, or impact..."
          class="w-full pl-10 pr-10 py-2.5 bg-white border border-stone-300/80 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/50 focus:border-stone-500 transition-all shadow-sm"
          aria-label="Filter portfolio artifacts"
        />
        {#if searchQuery}
          <button
            type="button"
            onclick={() => (searchQuery = '')}
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
            aria-label="Clear search query"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        {/if}
      </div>

      <!-- Exhibition Counter -->
      <div class="text-xs font-mono text-stone-500 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-stone-700"></span>
        Displaying <span class="text-stone-900 font-semibold">{filteredArtifacts.length}</span> of {artifacts.length} curated case studies
      </div>
    </div>

    <!-- Gallery Wings Filter Strip -->
    <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200">
      <span class="text-xs font-mono font-semibold uppercase tracking-wider text-stone-400 mr-2">Discipline:</span>
      {#each allTags as tag}
        <button
          type="button"
          onclick={() => (selectedTag = tag)}
          class="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer {selectedTag === tag
            ? 'bg-stone-900 text-stone-50 shadow-sm ring-1 ring-stone-900 font-semibold'
            : 'bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-stone-200'}"
        >
          {tag}
          {#if tag !== 'All'}
            <span class="ml-1 opacity-70 text-[10px]">
              ({artifacts.filter((a) => a.tags && a.tags.includes(tag)).length})
            </span>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- Gallery Wall Grid -->
  {#if filteredArtifacts.length === 0}
    <div class="py-20 text-center rounded-2xl border border-dashed border-stone-300 bg-stone-100/60 p-8">
      <p class="font-serif text-lg text-stone-600 mb-4">No campaign artifacts match the selected criteria.</p>
      <button
        type="button"
        onclick={() => {
          selectedTag = 'All';
          searchQuery = '';
        }}
        class="px-4 py-2 text-xs font-medium rounded-full bg-stone-900 text-stone-50 hover:bg-stone-800 transition cursor-pointer"
      >
        Reset gallery filters
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {#each filteredArtifacts as artifact (artifact.id)}
        <article
          class="group relative flex flex-col bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300"
        >
          <!-- Artifact Preview Frame (Accessible Button) -->
          <button
            type="button"
            class="relative w-full aspect-[16/10] overflow-hidden bg-stone-100 border-b border-stone-100 cursor-pointer block text-left p-0 border-0"
            onclick={() => openModal(artifact)}
            aria-label={"Examine case study: " + artifact.title}
          >
            {#if artifact.previewImage}
              <img
                src={artifact.previewImage}
                alt={artifact.title}
                class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            {:else}
              <div class="w-full h-full flex items-center justify-center bg-stone-200 text-stone-400 font-serif italic">
                Visual preview unavailable
              </div>
            {/if}

            <!-- Video Play Button Overlay on Card -->
            {#if artifact.mediaType === 'video'}
              <div class="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <div class="w-11 h-11 rounded-full bg-stone-900/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm border border-white/20">
                  <svg class="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            {/if}

            <!-- Visual Overlay Badges -->
            <div class="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none gap-2">
              <div class="flex items-center gap-1.5">
                {#if artifact.featured}
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-stone-900/90 text-stone-50 backdrop-blur-md shadow-sm shrink-0">
                    Featured
                  </span>
                {/if}
                {#if artifact.mediaType === 'video'}
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-amber-600/90 text-stone-50 backdrop-blur-md shadow-sm shrink-0 flex items-center gap-1">
                    <svg class="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Video
                  </span>
                {:else if artifact.mediaType === 'document'}
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-stone-800/80 text-stone-50 backdrop-blur-md shadow-sm shrink-0">
                    Doc
                  </span>
                {/if}
              </div>

              {#if artifact.metrics}
                <span class="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold bg-white/95 text-stone-900 shadow-md backdrop-blur-md border border-stone-200/60 truncate">
                  {artifact.metrics}
                </span>
              {/if}
            </div>
          </button>

          <!-- Exhibition Placard (Card Content) -->
          <div class="p-5 sm:p-6 flex flex-col justify-between flex-1 space-y-4">
            <div>
              <!-- Tag Badges Strip -->
              <div class="flex flex-wrap gap-1.5 mb-2.5">
                {#each artifact.tags as tag}
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-700 border border-stone-200/70">
                    {tag}
                  </span>
                {/each}
              </div>

              <!-- Campaign Title (Accessible Button) -->
              <h3 class="leading-snug mb-2 line-clamp-2">
                <button
                  type="button"
                  class="text-left font-serif text-lg sm:text-xl font-bold text-stone-900 group-hover:text-stone-700 transition-colors cursor-pointer p-0 border-0 bg-transparent"
                  onclick={() => openModal(artifact)}
                >
                  {artifact.title}
                </button>
              </h3>

              <!-- Narrative Summary -->
              <p class="text-xs sm:text-sm text-stone-600 leading-relaxed line-clamp-3">
                {artifact.description}
              </p>
            </div>

            <!-- Placard Action Footer -->
            <div class="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
              <div>
                {#if artifact.showDate && artifact.date}
                  <span class="text-[11px] font-mono text-stone-400 shrink-0">
                    {new Date(artifact.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                  </span>
                {/if}
              </div>

              <button
                type="button"
                onclick={() => openModal(artifact)}
                class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-stone-900 text-stone-50 hover:bg-stone-800 focus:ring-2 focus:ring-stone-400 focus:outline-none transition-all cursor-pointer shadow-sm group-hover:shadow shrink-0 ml-auto"
                aria-haspopup="dialog"
              >
                <span>{artifact.mediaType === 'video' ? 'Watch' : 'Examine'}</span>
                <svg class="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}

  <!-- Popup Lightbox Modal (<dialog>) -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <dialog
    bind:this={dialogRef}
    onclick={handleBackdropClick}
    onclose={handleDialogClose}
    class="backdrop:bg-stone-950/60 backdrop:backdrop-blur-sm bg-transparent p-4 max-w-3xl w-full max-h-[92vh] focus:outline-none m-auto"
  >
    {#if activeArtifact}
      <div
        class="bg-[#faf8f5] border border-stone-300/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-stone-800"
      >
        <!-- Lightbox Sticky Header -->
        <div class="p-5 px-6 border-b border-stone-200 bg-white/95 backdrop-blur-md sticky top-0 z-20 flex items-start justify-between gap-4">
          <div class="space-y-1.5">
            <div class="flex flex-wrap gap-1.5 items-center">
              {#each activeArtifact.tags as tag}
                <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-stone-100 text-stone-800 border border-stone-200">
                  {tag}
                </span>
              {/each}
              {#if activeArtifact.mediaType === 'video'}
                <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-600 text-stone-50 flex items-center gap-1">
                  <svg class="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Video Showcase
                </span>
              {/if}
              {#if activeArtifact.metrics}
                <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-stone-900 text-stone-50">
                  {activeArtifact.metrics}
                </span>
              {/if}
            </div>
            <h2 class="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
              {activeArtifact.title}
            </h2>
          </div>

          <button
            type="button"
            onclick={closeModal}
            class="p-2 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
            aria-label="Close case study dialog"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Lightbox Scrollable Content -->
        <div class="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm">
          <!-- Media Preview (Interactive Video Player or Large Visual Artwork) -->
          {#if activeArtifact.mediaType === 'video' && activeArtifact.videoUrl && modalHeroImage === activeArtifact.previewImage}
            {@const embed = getEmbedUrl(activeArtifact.videoUrl)}
            <div class="rounded-xl overflow-hidden border border-stone-200 shadow-lg bg-black aspect-video w-full">
              {#if embed.type === 'youtube' || embed.type === 'vimeo'}
                <iframe
                  src={embed.src}
                  title={activeArtifact.title}
                  class="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                ></iframe>
              {:else if embed.type === 'video'}
                <video
                  src={embed.src}
                  controls
                  playsinline
                  preload="metadata"
                  poster={activeArtifact.previewImage}
                  class="w-full h-full object-contain bg-black"
                >
                  <track kind="captions" />
                  Your browser does not support the video tag.
                </video>
              {:else if activeArtifact.previewImage}
                <img
                  src={activeArtifact.previewImage}
                  alt={activeArtifact.title}
                  class="w-full h-full object-cover object-center"
                />
              {/if}
            </div>
          {:else if modalHeroImage}
            <div class="relative rounded-xl overflow-hidden border border-stone-200 shadow-md bg-stone-100 max-h-96 group/preview">
              <img
                src={modalHeroImage}
                alt={activeArtifact.title}
                class="w-full h-full object-cover object-center"
              />
              {#if activeArtifact.mediaType === 'video' && activeArtifact.videoUrl && modalHeroImage !== activeArtifact.previewImage}
                <button
                  type="button"
                  onclick={() => {
                    modalHeroImage = activeArtifact?.previewImage || null;
                  }}
                  class="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-mono bg-stone-900/90 text-stone-50 hover:bg-stone-900 transition-colors shadow-md backdrop-blur-sm cursor-pointer flex items-center gap-1.5"
                >
                  <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Return to Video
                </button>
              {:else if activeArtifact.previewImage && modalHeroImage !== activeArtifact.previewImage}
                <button
                  type="button"
                  onclick={() => {
                    modalHeroImage = activeArtifact?.previewImage || null;
                  }}
                  class="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-mono bg-stone-900/90 text-stone-50 hover:bg-stone-900 transition-colors shadow-md backdrop-blur-sm cursor-pointer"
                >
                  Reset to Cover
                </button>
              {/if}
            </div>
          {/if}

          <!-- Executive Summary Callout -->
          <div class="p-5 rounded-xl bg-white border border-stone-200/90 shadow-sm text-stone-700 leading-relaxed font-normal">
            <span class="font-mono text-xs uppercase tracking-wider text-stone-400 block mb-1">Executive Summary</span>
            {activeArtifact.description}
          </div>

          <!-- Markdown Case Study Body (Supports inline images ![Alt](url)) -->
          {#if activeArtifact.body}
            <div class="prose prose-stone max-w-none text-stone-700">
              {@html renderFormattedBody(activeArtifact.body)}
            </div>
          {/if}

          <!-- Supporting Collateral / Gallery Images (Optional) -->
          {#if activeArtifact.galleryImages && activeArtifact.galleryImages.length > 0}
            <div class="space-y-3 pt-4 border-t border-stone-200/90">
              <div class="flex items-center justify-between">
                <h4 class="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-stone-700 inline-block"></span>
                  Supporting Collateral & Assets ({activeArtifact.galleryImages.length})
                </h4>
                <span class="text-[11px] font-mono text-stone-500">Curated Exhibition</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {#each activeArtifact.galleryImages as imgUrl, idx}
                  <button
                    type="button"
                    class="group/asset relative rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shadow-sm hover:shadow-md transition-all text-left cursor-pointer p-0 block w-full focus:outline-none focus:ring-2 focus:ring-stone-400"
                    onclick={() => {
                      modalHeroImage = imgUrl;
                    }}
                    aria-label={`View collateral visual ${idx + 1}`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${activeArtifact.title} collateral ${idx + 1}`}
                      class="w-full h-44 object-cover object-center group-hover/asset:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div class="absolute inset-0 bg-stone-900/10 group-hover/asset:bg-stone-900/20 transition-colors"></div>
                    <div class="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-stone-900/85 text-[10px] font-mono text-stone-100 backdrop-blur-sm opacity-0 group-hover/asset:opacity-100 transition-opacity flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Feature in preview
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- Lightbox Footer -->
        <div class="p-4 px-6 border-t border-stone-200 bg-white flex items-center justify-between gap-4">
          <div class="text-xs font-mono text-stone-500">
            {#if activeArtifact.showDate && activeArtifact.date}
              Archived on {new Date(activeArtifact.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
            {/if}
          </div>

          <div class="flex items-center gap-3">
            {#if activeArtifact.showLiveLink && activeArtifact.link}
              <a
                href={activeArtifact.link}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-stone-900 text-stone-50 hover:bg-stone-800 transition shadow-sm"
              >
                <span>View Live Project</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            {/if}
            <button
              type="button"
              onclick={closeModal}
              class="px-4 py-2 rounded-full text-xs font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    {/if}
  </dialog>
</div>

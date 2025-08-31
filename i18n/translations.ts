export const translations = {
  en: {
    // GenreSelector
    title: "Storyly",
    subtitle: "Choose a genre, create your own, or load a saved adventure.",
    load_adventure: "Load Saved Adventure",
    no_saved_game: "No Saved Game Found",
    or_divider: "OR",
    create_genre_placeholder: "Or create your own genre...",
    start_button: "Start",
    starting_button: "Starting...",
    predefined_fantasy: "Classic Fantasy",
    predefined_cyberpunk: "Cyberpunk Dystopia",
    predefined_horror: "Cosmic Horror",
    predefined_detective: "Hard-Boiled Detective",
    predefined_expedition: "Lost World Expedition",

    // StoryBlock
    player_decision: "Your decision:",

    // LoadingSpinner
    story_unfolds: "The story unfolds...",

    // App Header
    save_game: "Save Game",
    game_saved: "Saved!",
    home: "Home",
    
    // App Modals
    home_confirm_body: "Are you sure you want to return to the home screen? Unsaved progress will be lost.",
    confirm_action: "Confirm Action",
    yes: "Yes",
    no: "No",
    cancel: "Cancel",
    confirm: "Confirm",

    // App Error
    error_title: "A problem has occurred!",
    error_generate_failed: "Failed to generate the next part of the story. The adventure may have hit a snag!",
    error_load_failed: "Failed to load saved game. The data might be corrupted.",

    // App Story View
    storyteller_continues: "The Storyteller Continues...",
    what_do_you_do: "What do you do?",

    // App Footer
    footer_text: "Powered by loopd.site — where your choices shape the story.",

    // Language
    language_name: "English",
  },
  pt: {
    // GenreSelector
    title: "Storyly",
    subtitle: "Escolha um gênero, crie o seu próprio, ou carregue uma aventura salva.",
    load_adventure: "Carregar Aventura Salva",
    no_saved_game: "Nenhum Jogo Salvo Encontrado",
    or_divider: "OU",
    create_genre_placeholder: "Ou crie seu próprio gênero...",
    start_button: "Começar",
    starting_button: "Começando...",
    predefined_fantasy: "Fantasia Clássica",
    predefined_cyberpunk: "Distopia Cyberpunk",
    predefined_horror: "Horror Cósmico",
    predefined_detective: "Detetive Durão",
    predefined_expedition: "Expedição ao Mundo Perdido",
    
    // StoryBlock
    player_decision: "Sua decisão:",

    // LoadingSpinner
    story_unfolds: "A história se desenrola...",

    // App Header
    save_game: "Salvar Jogo",
    game_saved: "Salvo!",
    home: "Início",
    
    // App Modals
    home_confirm_body: "Tem certeza de que deseja voltar para a tela inicial? O progresso não salvo será perdido.",
    confirm_action: "Confirmar Ação",
    yes: "Sim",
    no: "Não",
    cancel: "Cancelar",
    confirm: "Confirmar",

    // App Error
    error_title: "Ocorreu um problema!",
    error_generate_failed: "Falha ao gerar a próxima parte da história. A aventura pode ter encontrado um obstáculo!",
    error_load_failed: "Falha ao carregar o jogo salvo. Os dados podem estar corrompidos.",

    // App Story View
    storyteller_continues: "O Narrador Continua...",
    what_do_you_do: "O que você faz?",

    // App Footer
    footer_text: "Desenvolvido por loopd.site — onde suas escolhas moldam a história.",

    // Language
    language_name: "Português",
  },
};

export type Language = keyof typeof translations;
export const defaultLanguage: Language = 'en';
export const languages = Object.keys(translations) as Language[];
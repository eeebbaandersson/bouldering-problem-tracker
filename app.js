 const { createApp } = Vue

        createApp({
            data() {
                return {
                    selectedStatus: '',
                    selectedGrade: '',
                    selectedStyle: '',

                    editingId: null,
                    isEditingProfile: false,

                    user: {
                        name: '',
                        favoriteStyle: '',
                        saveData: true
                    },

                    newProblem: {
                        style: '',
                        grade: '',
                        tries: 1,
                        status: 'Send',
                        gym: '',
                        date: new Date().toISOString().split('T')[0],
                        notes: ''
                    },

                    problems: [
                        {
                            id: 1,
                            style: 'slab',
                            grade: '6B',
                            tries: 1,
                            status: 'Send',
                            gym: 'Backa Boulder',
                            date: '2026-09-01',
                            notes: 'Solved it on the first atempt!'
                        },
                        {
                            id: 2,
                            style: 'overhang',
                            grade: '6A',
                            tries: 3,
                            status: 'Project',
                            gym: 'Backa Boulder',
                            date: '2026-09-01',
                            notes: 'Still working on this one...'
                        }   
                    ]
                }
            },
            created() {
                const savedUser = localStorage.getItem('bouldering_user');

                if (savedUser) {
                    this.user = JSON.parse(savedUser);
                }

                if (this.user.saveData) {
                    const savedProblems = localStorage.getItem('bouldering_problems');
                    if (savedProblems) {
                        this.problems = JSON.parse(savedProblems);
                    }
                }
            },
            computed: {
                totalSends() {
                    return this.problems.filter(p => p.status === 'Send').length;
                },
                activeProjects() {
                    return this.problems.filter(p => p.status === 'Project').length;
                },
                totalFlashes() {
                    return this.problems.filter(p => p.status === 'Send' && Number(p.tries) === 1).length;
                },
                totalResets() {
                    return this.problems.filter(p => p.status === 'Reset').length;
                },
                filteredProblems() {
                    const filtered = this.problems.filter(problem => {
                        const statusVal = this.selectedStatus.toLowerCase();
                        const probStatus = problem.status.toLowerCase();
                        const isFlash = probStatus === 'flash' || (probStatus === 'send' && Number(problem.tries) === 1);

                        let matchesStatus = true;
                        if (statusVal === 'send') {
                            // Visa både Sends och Flashes under Sends
                            matchesStatus = probStatus === 'send' || probStatus === 'flash';
                        } else if (statusVal === 'flash') {
                            // Visa bara det som faktiskt räknas som Flash
                            matchesStatus = isFlash;
                        } else if (statusVal) {
                            matchesStatus = probStatus === statusVal;
                        }

                        const matchesGrade = !this.selectedGrade || problem.grade.toLowerCase() === this.selectedGrade.toLowerCase();
                        const matchesStyle = !this.selectedStyle || problem.style.toLowerCase() === this.selectedStyle.toLowerCase();

                        return matchesStatus && matchesGrade && matchesStyle;
                    });

                    // Sortera problem utifrån nyast datum
                    return filtered.sort((a, b) => {
                        const dateA = new Date(a.date).getTime();
                        const dateB = new Date(b.date).getTime();

                        if (dateB === dateA) {
                            return b.id - a.id;
                        }

                        return dateB - dateA;
                    });
                },
                hasActiveFilters() {
                    return this.selectedStatus || this.selectedGrade || this.selectedStyle;
                }
            },
            methods: {
                getDisplayStatus(problem) {
                    const isFlash = problem.status.toLowerCase() === 'send' && Number(problem.tries) === 1;
                    return isFlash ? 'FLASH' : problem.status;
                },
                resetFilters() {
                    this.selectedStatus = '';
                    this.selectedGrade = '';
                    this.selectedStyle = '';
                },
                editProblem(problem) {
                    this.editingId = problem.id;
                    // Skapar en ny kopia till formuläret med alla fält genom spread-operatorn (...)
                    this.newProblem = { ...problem };

                    // Vänta tills UI:n uppdaterats($nextTick), skrolla sedan till formuläret
                    this.$nextTick(() => {
                        this.$refs.formSection.scrollIntoView({ block: 'start' });
                    });
                },
                saveProblem() {
                    if (this.editingId) {
                        this.updateCurrentProblem(this.editingId);
                    } else {
                        this.logNewProblem();
                    }

                    if (this.user.saveData) {
                        localStorage.setItem('bouldering_problems', JSON.stringify(this.problems));
                    }
                    this.resetForm();
                },
                logNewProblem() {
                    this.problems.push({
                        id: Date.now(),
                        style: this.newProblem.style,
                        grade: this.newProblem.grade,
                        tries: this.newProblem.tries,
                        status: this.newProblem.status,
                        gym: this.newProblem.gym,
                        date: this.newProblem.date,
                        notes: this.newProblem.notes
                    })

                    this.newProblem = {
                        style: '',
                        grade: '',
                        tries: 1,
                        status: 'Send',
                        gym: '',
                        date: new Date().toISOString().split('T')[0],
                        notes: ''
                    };
                },
                updateCurrentProblem(id) {
                    const index = this.problems.findIndex(p => p.id === id);
                    if (index !== -1) {
                        this.problems[index] = { ...this.newProblem, id };
                    }
                },
                resetForm() {
                    this.editingId = null;
                    this.newProblem = {
                        style: '',
                        grade: '',
                        tries: 1,
                        status: 'Send',
                        gym: '',
                        date: new Date().toISOString().split('T')[0],
                        notes: ''
                    };
                },
                markAsReset() {
                    if (!this.editingId) return;

                    this.newProblem.status = 'Reset';

                    this.updateCurrentProblem(this.editingId);

                    if (this.user.saveData) {
                        localStorage.setItem('bouldering_problems', JSON.stringify(this.problems));
                    }

                    this.resetForm();
                },
                deleteProblem(id) {
                    if (this.editingId === id) {
                        this.resetForm();
                    }
                    this.problems = this.problems.filter(p => p.id !== id);

                    if (this.user.saveData) {
                        localStorage.setItem('bouldering_problems', JSON.stringify(this.problems));
                    }
                },
                updateProfile() {
                    this.saveProfile();
                    this.isEditingProfile = false;
                },
                saveProfile() {
                    if (this.user.saveData) {
                        localStorage.setItem('bouldering_user', JSON.stringify(this.user));
                        localStorage.setItem('bouldering_problems', JSON.stringify(this.problems));
                    }
                },
                handleStorage() {
                    if (!this.user.saveData) {
                        // Om användaren slår av lokal sparning, rensa data från localStorage
                        localStorage.removeItem('bouldering_user');
                        localStorage.removeItem('bouldering_problems');
                    } else {
                        this.saveProfile();
                    }
                }
            }
        }).mount('#app')
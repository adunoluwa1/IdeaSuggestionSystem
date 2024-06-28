import { LightningElement, track, wire } from 'lwc';
import getSuggestions from '@salesforce/apex/SuggestionController.getSuggestions';
import getCategories from '@salesforce/apex/SuggestionController.getCategories';
import createSuggestion from '@salesforce/apex/SuggestionController.createSuggestion';
import upvoteSuggestion from '@salesforce/apex/SuggestionController.upvoteSuggestion';
import downvoteSuggestion from '@salesforce/apex/SuggestionController.downvoteSuggestion';
import addComment from '@salesforce/apex/SuggestionController.addComment';
import deleteComment from '@salesforce/apex/SuggestionController.deleteComment';
import getComments from '@salesforce/apex/SuggestionController.getComments';
import { refreshApex } from '@salesforce/apex';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import NAME_FIELD from '@salesforce/schema/User.Name';

export default class SuggestionSystem extends LightningElement {
    @track suggestions;
    @track paginatedSuggestions;
    @track categories;
    @track categoryOptions = [];
    @track selectedCategories = [];
    @track filterCategories = [];
    @track isModalOpen = false;
    @track isCommentModalOpen = false;
    @track isDetailModalOpen = false;
    @track commentSuggestionId;
    @track detailSuggestion = {};
    @track detailComments = [];
    @track suggestionsPerPage = '5';
    @track currentPage = 1;
    @track totalPages;
    @track isFirstPage = true;
    @track isLastPage = false;
    suggestionTitle = '';
    suggestionDescription = '';
    suggestionCategory = '';
    commentText = '';
    commentFirstName = '';
    commentLastName = '';
    searchQuery = '';
    filterType = 'All Suggestions';
    wiredSuggestionsResult;
    suggestionsPerPageOptions = [
        { label: '5', value: '5' },
        { label: '10', value: '10' },
        { label: '20', value: '20' }
    ];

    userName;

    @wire(getRecord, { recordId: USER_ID, fields: [NAME_FIELD] })
    wiredUser({ error, data }) {
        if (data) {
            this.userName = getFieldValue(data, NAME_FIELD);
        } else if (error) {
            console.error('Error fetching user name:', error);
        }
    }

    @wire(getCategories)
    wiredCategories({ error, data }) {
        if (data) {
            this.categories = data;
            this.categoryOptions = data.map(category => {
                return { label: category, value: category };
            });
        } else if (error) {
            console.error('Error fetching categories:', error);
        }
    }

    @wire(getSuggestions, { filterType: '$filterType', categories: '$filterCategories', searchQuery: '$searchQuery' })
    wiredSuggestions(result) {
        this.wiredSuggestionsResult = result;
        if (result.data) {
            this.suggestions = result.data.map(suggestion => {
                return { 
                    ...suggestion, 
                    comments: [], 
                    Submission_Date__c: this.formatDate(suggestion.Submission_Date__c) 
                };
            });
            this.updatePagination();
        } else if (result.error) {
            console.error('Error fetching suggestions:', result.error);
        }
    }

    formatDate(date) {
        let d = new Date(date);
        let year = d.getFullYear();
        let month = ('0' + (d.getMonth() + 1)).slice(-2);
        let day = ('0' + d.getDate()).slice(-2);
        let hours = d.getHours();
        let minutes = ('0' + d.getMinutes()).slice(-2);
        let ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        let strTime = hours + ':' + minutes + ' ' + ampm;
        return year + '-' + month + '-' + day + ' ' + strTime;
    }

    updatePagination() {
        this.totalPages = Math.ceil(this.suggestions.length / this.suggestionsPerPage);
        this.currentPage = 1;
        this.paginateSuggestions();
    }

    paginateSuggestions() {
        const start = (this.currentPage - 1) * this.suggestionsPerPage;
        const end = this.currentPage * this.suggestionsPerPage;
        this.paginatedSuggestions = this.suggestions.slice(start, end);
        this.isFirstPage = this.currentPage === 1;
        this.isLastPage = this.currentPage === this.totalPages;
    }

    handleTitleChange(event) {
        this.suggestionTitle = event.target.value;
    }

    handleDescriptionChange(event) {
        this.suggestionDescription = event.target.value;
    }

    handleCategoryChange(event) {
        this.suggestionCategory = event.target.value;
    }

    handleCommentChange(event) {
        this.commentText = event.target.value;
    }

    handleCommentFirstNameChange(event) {
        this.commentFirstName = event.target.value;
    }

    handleCommentLastNameChange(event) {
        this.commentLastName = event.target.value;
    }

    handleSearchChange(event) {
        this.searchQuery = event.target.value;
        refreshApex(this.wiredSuggestionsResult);
    }

    handleCategoryCheckboxChange(event) {
        const category = event.target.label;
        if (event.target.checked) {
            if (!this.selectedCategories.includes(category)) {
                this.selectedCategories.push(category);
            }
        } else {
            this.selectedCategories = this.selectedCategories.filter(cat => cat !== category);
        }
    }

    handleSuggestionsPerPageChange(event) {
        this.suggestionsPerPage = event.target.value;
        this.updatePagination();
    }

    filterAllSuggestions() {
        this.filterType = 'All Suggestions';
        refreshApex(this.wiredSuggestionsResult);
    }

    filterRecentSuggestions() {
        this.filterType = 'Recent Suggestions';
        refreshApex(this.wiredSuggestionsResult);
    }

    filterHighestRankedSuggestions() {
        this.filterType = 'Highest Ranked Suggestions';
        refreshApex(this.wiredSuggestionsResult);
    }

    applyCategoryFilter() {
        this.filterCategories = [...this.selectedCategories];
        refreshApex(this.wiredSuggestionsResult);
    }

    showModal() {
        this.isModalOpen = true;
    }

    hideModal() {
        this.isModalOpen = false;
    }

    showCommentModal(event) {
        this.commentSuggestionId = event.target.dataset.id;
        this.isCommentModalOpen = true;
    }

    hideCommentModal() {
        this.isCommentModalOpen = false;
    }

    showDetailModal() {
        this.isDetailModalOpen = true;
    }

    hideDetailModal() {
        this.isDetailModalOpen = false;
    }

    submitSuggestion() {
        const newSuggestion = {
            Name: this.suggestionTitle,
            Description__c: this.suggestionDescription,
            Category__c: this.suggestionCategory,
            Submitter__c: this.userName
        };
        createSuggestion({ newSuggestion })
            .then(() => {
                this.isModalOpen = false;
                refreshApex(this.wiredSuggestionsResult);
            })
            .catch(error => {
                console.error('Error creating suggestion:', error);
            });
    }

    upvote(event) {
        const suggestionId = event.target.dataset.id;
        upvoteSuggestion({ suggestionId })
            .then(() => {
                refreshApex(this.wiredSuggestionsResult);
            })
            .catch(error => {
                console.error('Error upvoting suggestion:', error);
            });
    }

    downvote(event) {
        const suggestionId = event.target.dataset.id;
        downvoteSuggestion({ suggestionId })
            .then(() => {
                refreshApex(this.wiredSuggestionsResult);
            })
            .catch(error => {
                console.error('Error downvoting suggestion:', error);
            });
    }

    upvoteDetail(event) {
        const suggestionId = event.target.dataset.id;
        upvoteSuggestion({ suggestionId })
            .then(() => {
                this.detailSuggestion.Upvote_Count__c++;
                this.refreshComments(suggestionId); // Refresh comments to show updated counts
            })
            .catch(error => {
                console.error('Error upvoting suggestion:', error);
            });
    }

    downvoteDetail(event) {
        const suggestionId = event.target.dataset.id;
        downvoteSuggestion({ suggestionId })
            .then(() => {
                this.detailSuggestion.Downvote_Count__c++;
                this.refreshComments(suggestionId); // Refresh comments to show updated counts
            })
            .catch(error => {
                console.error('Error downvoting suggestion:', error);
            });
    }

    submitComment() {
        const newComment = {
            Suggestion__c: this.commentSuggestionId,
            Comment_Text__c: this.commentText,
            Submitter__c: `${this.commentFirstName} ${this.commentLastName}`
        };
        addComment({ newComment, firstName: this.commentFirstName, lastName: this.commentLastName })
            .then(() => {
                this.commentText = '';
                this.commentFirstName = '';
                this.commentLastName = '';
                this.isCommentModalOpen = false;
                this.refreshComments(this.commentSuggestionId);
            })
            .catch(error => {
                console.error('Error adding comment:', error);
            });
    }

    deleteComment(event) {
        const commentId = event.target.dataset.id;
        deleteComment({ commentId })
            .then(() => {
                const suggestionId = this.suggestions.find(suggestion => suggestion.comments.some(comment => comment.Id === commentId)).Id;
                this.refreshComments(suggestionId);
            })
            .catch(error => {
                console.error('Error deleting comment:', error);
            });
    }

    deleteCommentDetail(event) {
        const commentId = event.target.dataset.id;
        deleteComment({ commentId })
            .then(() => {
                this.detailComments = this.detailComments.filter(comment => comment.Id !== commentId);
            })
            .catch(error => {
                console.error('Error deleting comment:', error);
            });
    }

    handleSuggestionClick(event) {
        const suggestionId = event.target.dataset.id;
        this.detailSuggestion = this.suggestions.find(s => s.Id === suggestionId);
        this.detailSuggestion.formattedSubmissionDate = this.formatDate(this.detailSuggestion.Submission_Date__c);
        this.refreshComments(suggestionId);
        this.showDetailModal();
    }

    refreshComments(suggestionId) {
        getComments({ suggestionId })
            .then(result => {
                const suggestion = this.suggestions.find(s => s.Id === suggestionId);
                suggestion.comments = result.map(comment => {
                    return {
                        ...comment,
                        formattedCommentDate: this.formatDate(comment.Comment_Date__c)
                    };
                });
                this.detailComments = suggestion.comments;
            })
            .catch(error => {
                console.error('Error fetching comments:', error);
            });
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.paginateSuggestions();
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.paginateSuggestions();
        }
    }
}

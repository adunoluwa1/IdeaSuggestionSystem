public with sharing class SuggestionController {
    @AuraEnabled(cacheable=true)
    public static List<Suggestion__c> getSuggestions(String filterType, List<String> categories, String searchQuery) {
        String query = 'SELECT Id, Name, Description__c, Category__c, Upvote_Count__c, Downvote_Count__c, Submission_Date__c, Submitter__c FROM Suggestion__c';
        List<String> conditions = new List<String>();

        if (!categories.isEmpty()) {
            String categoryCondition = 'Category__c IN (';
            for (String category : categories) {
                categoryCondition += '\'' + category + '\',';
            }
            categoryCondition = categoryCondition.removeEnd(',') + ')';
            conditions.add(categoryCondition);
        }

        if (searchQuery != null && searchQuery != '') {
            conditions.add('Name LIKE \'%' + searchQuery + '%\'');
        }

        if (!conditions.isEmpty()) {
            query += ' WHERE ' + String.join(conditions, ' AND ');
        }

        if (filterType == 'Recent Suggestions') {
            query += ' ORDER BY Submission_Date__c DESC';
        } else if (filterType == 'Highest Ranked Suggestions') {
            query += ' ORDER BY Upvote_Count__c DESC';
        }

        return Database.query(query);
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getCategories() {
        Schema.DescribeFieldResult fieldResult = Suggestion__c.Category__c.getDescribe();
        List<Schema.PicklistEntry> ple = fieldResult.getPicklistValues();
        List<String> categories = new List<String>();
        for (Schema.PicklistEntry entry : ple) {
            categories.add(entry.getLabel());
        }
        return categories;
    }

    @AuraEnabled
    public static void createSuggestion(Suggestion__c newSuggestion) {
        newSuggestion.Submission_Date__c = Datetime.now();
        newSuggestion.Submitter__c = UserInfo.getUserName();
        insert newSuggestion;
    }

    @AuraEnabled
    public static void upvoteSuggestion(Id suggestionId) {
        Id userId = UserInfo.getUserId();
        Vote__c existingVote = getExistingVote(suggestionId, userId);

        if (existingVote != null) {
            if (existingVote.Vote_Type__c == 'Downvote') {
                existingVote.Vote_Type__c = 'Upvote';
                update existingVote;

                Suggestion__c suggestion = [SELECT Upvote_Count__c, Downvote_Count__c FROM Suggestion__c WHERE Id = :suggestionId];
                suggestion.Upvote_Count__c++;
                suggestion.Downvote_Count__c--;
                update suggestion;
            }
        } else {
            Vote__c newVote = new Vote__c(Suggestion__c = suggestionId, User__c = userId, Vote_Type__c = 'Upvote');
            insert newVote;

            Suggestion__c suggestion = [SELECT Upvote_Count__c FROM Suggestion__c WHERE Id = :suggestionId];
            suggestion.Upvote_Count__c++;
            update suggestion;
        }
    }

    @AuraEnabled
    public static void downvoteSuggestion(Id suggestionId) {
        Id userId = UserInfo.getUserId();
        Vote__c existingVote = getExistingVote(suggestionId, userId);

        if (existingVote != null) {
            if (existingVote.Vote_Type__c == 'Upvote') {
                existingVote.Vote_Type__c = 'Downvote';
                update existingVote;

                Suggestion__c suggestion = [SELECT Upvote_Count__c, Downvote_Count__c FROM Suggestion__c WHERE Id = :suggestionId];
                suggestion.Upvote_Count__c--;
                suggestion.Downvote_Count__c++;
                update suggestion;
            }
        } else {
            Vote__c newVote = new Vote__c(Suggestion__c = suggestionId, User__c = userId, Vote_Type__c = 'Downvote');
            insert newVote;

            Suggestion__c suggestion = [SELECT Downvote_Count__c FROM Suggestion__c WHERE Id = :suggestionId];
            suggestion.Downvote_Count__c++;
            update suggestion;
        }
    }

    @AuraEnabled
    public static void addComment(Comment__c newComment) {
        newComment.Comment_Date__c = Datetime.now();
        newComment.Submitter__c = UserInfo.getUserName();
        insert newComment;
    }

    @AuraEnabled(cacheable=true)
    public static List<Comment__c> getComments(Id suggestionId) {
        return [SELECT Id, Comment_Text__c, Comment_Date__c, Submitter__c FROM Comment__c WHERE Suggestion__c = :suggestionId ORDER BY Comment_Date__c DESC];
    }

    @AuraEnabled
    public static void deleteComment(Id commentId) {
        delete [SELECT Id FROM Comment__c WHERE Id = :commentId];
    }

    private static Vote__c getExistingVote(Id suggestionId, Id userId) {
        List<Vote__c> votes = [SELECT Id, Vote_Type__c FROM Vote__c WHERE Suggestion__c = :suggestionId AND User__c = :userId];
        return votes.isEmpty() ? null : votes[0];
    }
}

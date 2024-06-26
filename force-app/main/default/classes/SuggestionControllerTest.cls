@isTest
public class SuggestionControllerTest {
    @isTest
    public static void testGetSuggestions() {
        List<Suggestion__c> testSuggestions = new List<Suggestion__c>();
        for(Integer i = 0; i < 5; i++) {
            testSuggestions.add(new Suggestion__c(Name = 'Test Suggestion ' + i, Description__c = 'Description ' + i, Category__c = 'General', Submitter__c = 'Test User'));
        }
        insert testSuggestions;
        
        Test.startTest();
        List<Suggestion__c> result = SuggestionController.getSuggestions('All Suggestions', new List<String>(), '');
        Test.stopTest();
        
        System.assertEquals(5, result.size());
    }

    @isTest
    public static void testGetCategories() {
        List<String> categories = SuggestionController.getCategories();
        System.assertNotEquals(0, categories.size());
    }

    @isTest
    public static void testCreateSuggestion() {
        Suggestion__c newSuggestion = new Suggestion__c(Name = 'New Suggestion', Description__c = 'New Description', Category__c = 'Technical');
        
        Test.startTest();
        SuggestionController.createSuggestion(newSuggestion);
        Test.stopTest();
        
        Suggestion__c result = [SELECT Id, Name, Description__c, Category__c, Submitter__c FROM Suggestion__c WHERE Id = :newSuggestion.Id];
        System.assertEquals('New Suggestion', result.Name);
        System.assertEquals('New Description', result.Description__c);
        System.assertEquals('Technical', result.Category__c);
        System.assertEquals(UserInfo.getUserName(), result.Submitter__c);
    }

    @isTest
    public static void testUpvoteSuggestion() {
        Suggestion__c newSuggestion = new Suggestion__c(Name = 'New Suggestion', Description__c = 'New Description', Category__c = 'Technical');
        insert newSuggestion;

        Test.startTest();
        SuggestionController.upvoteSuggestion(newSuggestion.Id);
        Test.stopTest();
        
        Suggestion__c result = [SELECT Id, Upvote_Count__c FROM Suggestion__c WHERE Id = :newSuggestion.Id];
        System.assertEquals(1, result.Upvote_Count__c);
    }

    @isTest
    public static void testDownvoteSuggestion() {
        Suggestion__c newSuggestion = new Suggestion__c(Name = 'New Suggestion', Description__c = 'New Description', Category__c = 'Technical');
        insert newSuggestion;

        Test.startTest();
        SuggestionController.downvoteSuggestion(newSuggestion.Id);
        Test.stopTest();
        
        Suggestion__c result = [SELECT Id, Downvote_Count__c FROM Suggestion__c WHERE Id = :newSuggestion.Id];
        System.assertEquals(1, result.Downvote_Count__c);
    }

    @isTest
    public static void testSwitchVote() {
        Suggestion__c newSuggestion = new Suggestion__c(Name = 'New Suggestion', Description__c = 'New Description', Category__c = 'Technical');
        insert newSuggestion;

        Test.startTest();
        SuggestionController.upvoteSuggestion(newSuggestion.Id);
        SuggestionController.downvoteSuggestion(newSuggestion.Id);
        Test.stopTest();
        
        Suggestion__c result = [SELECT Id, Upvote_Count__c, Downvote_Count__c FROM Suggestion__c WHERE Id = :newSuggestion.Id];
        System.assertEquals(0, result.Upvote_Count__c);
        System.assertEquals(1, result.Downvote_Count__c);
    }

    @isTest
    public static void testAddComment() {
        Suggestion__c newSuggestion = new Suggestion__c(Name = 'New Suggestion', Description__c = 'New Description', Category__c = 'Technical');
        insert newSuggestion;
        Comment__c newComment = new Comment__c(Suggestion__c = newSuggestion.Id, Comment_Text__c = 'Test Comment');

        Test.startTest();
        SuggestionController.addComment(newComment);
        Test.stopTest();
        
        List<Comment__c> comments = [SELECT Id, Comment_Text__c, Submitter__c FROM Comment__c WHERE Suggestion__c = :newSuggestion.Id];
        System.assertEquals(1, comments.size());
        System.assertEquals('Test Comment', comments[0].Comment_Text__c);
        System.assertEquals(UserInfo.getUserName(), comments[0].Submitter__c);
    }

    @isTest
    public static void testGetComments() {
        Suggestion__c newSuggestion = new Suggestion__c(Name = 'New Suggestion', Description__c = 'New Description', Category__c = 'Technical');
        insert newSuggestion;
        Comment__c newComment = new Comment__c(Suggestion__c = newSuggestion.Id, Comment_Text__c = 'Test Comment');
        insert newComment;

        Test.startTest();
        List<Comment__c> comments = SuggestionController.getComments(newSuggestion.Id);
        Test.stopTest();

        System.assertEquals(1, comments.size());
        System.assertEquals('Test Comment', comments[0].Comment_Text__c);
        System.assertEquals('Commenter', comments[0].Submitter__c);
    }

    @isTest
    public static void testDeleteComment() {
        Suggestion__c newSuggestion = new Suggestion__c(Name = 'New Suggestion', Description__c = 'New Description', Category__c = 'Technical');
        insert newSuggestion;
        Comment__c newComment = new Comment__c(Suggestion__c = newSuggestion.Id, Comment_Text__c = 'Test Comment');
        insert newComment;

        Test.startTest();
        SuggestionController.deleteComment(newComment.Id);
        Test.stopTest();

        List<Comment__c> comments = [SELECT Id, Comment_Text__c FROM Comment__c WHERE Suggestion__c = :newSuggestion.Id];
        System.assertEquals(0, comments.size());
    }
}

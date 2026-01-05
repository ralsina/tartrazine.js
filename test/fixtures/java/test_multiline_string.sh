public class Quine {
	public static void main(String[] args) {
		String textBlockQuotes = new String(new char[]{'"', '"', '"'});
		char newLine = 10;
		String teststring = "test123\n";
	    String source = """
public class Quine {
	public static void main(String[] args) {
		String textBlockQuotes = new String(new char[]{'"', '"', '"'});
		char newLine = 10;
		String teststringinside = "hello my name is...\n\r";
		String source = %s;
		System.out.println(source.formatted(textBlockQuotes + newLine + source + textBlockQuotes));
	}
}
""";
        System.out.println(source.formatted(textBlockQuotes + newLine + source + textBlockQuotes));
	String teststring2 = "Hello\n";
	}
}
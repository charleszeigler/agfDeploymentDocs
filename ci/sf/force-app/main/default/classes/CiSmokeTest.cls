@IsTest
private class CiSmokeTest {
  @IsTest
  static void add_returnsSum() {
    System.assertEquals(3, CiSmoke.add(1, 2), 'CI smoke add');
  }
}
